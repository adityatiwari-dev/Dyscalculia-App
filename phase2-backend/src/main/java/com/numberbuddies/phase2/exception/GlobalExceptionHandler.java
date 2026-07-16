package com.numberbuddies.phase2.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        log.warn("API Exception ({}): {}", ex.getStatus(), ex.getMessage());
        Map<String, String> errors = null;
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("Age must be")) {
                errors = Map.of("age", ex.getMessage());
            } else if (ex.getMessage().contains("valid grade")) {
                errors = Map.of("grade", ex.getMessage());
            }
        }
        return buildResponse(ex.getStatus(), ex.getMessage(), errors);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        });
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Validation failed");
        log.warn("Validation Error: {}", message);
        return buildResponse(HttpStatus.BAD_REQUEST, message, errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled Exception caught by controller advice", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred: " + ex.getMessage(), null);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message, Map<String, String> errors) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        if (errors != null && !errors.isEmpty()) {
            body.put("errors", errors);
        }
        return ResponseEntity.status(status).body(body);
    }
}
