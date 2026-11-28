package com.marian.project.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Fixed-window rate limits per client IP for the endpoints that attract abuse:
 * login (password guessing), registration and the contact/feedback forms (spam).
 *
 * In-memory, so limits are per server instance and reset on restart. That is enough for a
 * single instance; for several instances behind a load balancer use a shared store
 * (Redis, or the proxy's own rate limiting). Behind a reverse proxy, set
 * server.forward-headers-strategy=native so getRemoteAddr() is the real client address.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    record Rule(String method, String path, int limit, long windowMillis) {}

    static final List<Rule> RULES = List.of(
        new Rule("POST", "/api/user/login", 10, 5 * 60_000L),
        new Rule("POST", "/api/user/register", 10, 60 * 60_000L),
        new Rule("POST", "/api/contact", 5, 10 * 60_000L),
        new Rule("POST", "/api/feedback", 10, 10 * 60_000L)
    );

    private record Window(long start, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public RateLimitFilter() {
        this(Clock.systemUTC());
    }

    RateLimitFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Rule rule = RULES.stream()
            .filter(r -> r.method().equalsIgnoreCase(request.getMethod()) && r.path().equals(request.getRequestURI()))
            .findFirst()
            .orElse(null);
        if (rule == null || allow(rule, request.getRemoteAddr())) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(rule.windowMillis() / 1000));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"Too many attempts. Please wait a few minutes and try again.\"}");
    }

    boolean allow(Rule rule, String clientIp) {
        long now = clock.millis();
        String key = rule.path() + "|" + clientIp;
        Window updated = windows.compute(key, (k, w) ->
            (w == null || now - w.start() >= rule.windowMillis()) ? new Window(now, 1) : new Window(w.start(), w.count() + 1));
        if (windows.size() > 10_000) {
            // Drop expired windows so the map can't grow without bound.
            windows.entrySet().removeIf(e -> now - e.getValue().start() >= 60 * 60_000L);
        }
        return updated.count() <= rule.limit();
    }
}
