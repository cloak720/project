package com.marian.project.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    /** A clock the test can move forward. */
    static class TestClock extends Clock {
        long now = 1_000_000L;

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return Instant.ofEpochMilli(now);
        }

        @Override
        public long millis() {
            return now;
        }
    }

    private static MockHttpServletResponse send(RateLimitFilter filter, String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void loginIsLimitedPerIpAndResetsAfterTheWindow() throws Exception {
        TestClock clock = new TestClock();
        RateLimitFilter filter = new RateLimitFilter(clock);

        for (int i = 0; i < 10; i++) {
            assertThat(send(filter, "POST", "/api/user/login", "10.0.0.1").getStatus()).isEqualTo(200);
        }
        assertThat(send(filter, "POST", "/api/user/login", "10.0.0.1").getStatus()).isEqualTo(429);
        // A different client is unaffected.
        assertThat(send(filter, "POST", "/api/user/login", "10.0.0.2").getStatus()).isEqualTo(200);

        clock.now += 5 * 60_000L; // the 5-minute window passes
        assertThat(send(filter, "POST", "/api/user/login", "10.0.0.1").getStatus()).isEqualTo(200);
    }

    @Test
    void otherEndpointsAreNotLimited() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(new TestClock());
        for (int i = 0; i < 50; i++) {
            assertThat(send(filter, "GET", "/api/opportunities/available", "10.0.0.1").getStatus()).isEqualTo(200);
            assertThat(send(filter, "GET", "/api/user/login", "10.0.0.1").getStatus()).isEqualTo(200);
        }
    }

    @Test
    void tooManyResponseExplainsAndSaysWhenToRetry() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(new TestClock());
        for (int i = 0; i < 10; i++) {
            send(filter, "POST", "/api/user/register", "10.0.0.9");
        }
        MockHttpServletResponse response = send(filter, "POST", "/api/user/register", "10.0.0.9");
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("3600");
        assertThat(response.getContentAsString()).contains("Too many attempts");
    }
}
