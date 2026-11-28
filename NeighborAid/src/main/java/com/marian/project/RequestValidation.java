package com.marian.project;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Comparator;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * Validates a request body explicitly, inside the controller, AFTER the permission check.
 * Using @Valid on the parameter would validate first, so someone without permission would
 * learn the expected format from the error messages instead of simply getting 403.
 */
@Component
public class RequestValidation {

    private final Validator validator;

    public RequestValidation(Validator validator) {
        this.validator = validator;
    }

    /** A 400 response with the first problem found, or empty when the object is valid. */
    public Optional<ResponseEntity<?>> problems(Object body) {
        return validator.validate(body).stream()
            .sorted(Comparator.comparing(v -> v.getPropertyPath().toString()))
            .findFirst()
            .map(ConstraintViolation::getMessage)
            .map(message -> ResponseEntity.badRequest().body(java.util.Map.of("message", message)));
    }
}
