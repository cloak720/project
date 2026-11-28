package com.marian.project.security;

import com.marian.project.model.User;
import com.marian.project.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Ends the session of anyone who was suspended or deleted after logging in.
 * Without this, a ban only blocked new logins and existing sessions kept working.
 * The role is also refreshed from the database, so a role change takes effect immediately.
 */
@Component
public class SessionUserInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    public SessionUserInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return true; // Not logged in: each controller decides whether that is allowed.
        }
        Long userId = (Long) session.getAttribute("userId");
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getBanned())) {
            session.invalidate();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"message\":\"Your session has ended. Please log in again.\"}");
            return false;
        }
        session.setAttribute("role", user.getRole());
        session.setAttribute("userEmail", user.getEmail());
        return true;
    }
}
