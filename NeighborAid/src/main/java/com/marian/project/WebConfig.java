package com.marian.project;

import com.marian.project.security.SessionUserInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Comma-separated list of frontend origins allowed to call the API with cookies. */
    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    private final SessionUserInterceptor sessionUserInterceptor;

    public WebConfig(SessionUserInterceptor sessionUserInterceptor) {
        this.sessionUserInterceptor = sessionUserInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type")
            .allowCredentials(true)
            .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessionUserInterceptor).addPathPatterns("/api/**");
    }
}
