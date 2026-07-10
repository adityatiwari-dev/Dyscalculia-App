package com.numberbuddies.phase2.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.numberbuddies.phase2.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Calls an OpenAI-compatible chat completions API.
 */
@Service
public class LlmClientService {

    private static final Logger log = LoggerFactory.getLogger(LlmClientService.class);

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public LlmClientService(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String complete(String systemPrompt, String userPrompt) {
        AppProperties.Ai ai = appProperties.getAi();
        if (!ai.isEnabled()) {
            throw new LlmException("AI is disabled");
        }
        if (ai.getApiKey() == null || ai.getApiKey().isBlank()) {
            throw new LlmException("AI API key is not configured");
        }

        try {
            Map<String, Object> body = Map.of(
                    "model", ai.getModel(),
                    "messages", new Object[]{
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    },
                    "response_format", Map.of("type", "json_object"),
                    "temperature", 0.4
            );

            String requestBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ai.getApiUrl()))
                    .timeout(Duration.ofSeconds(ai.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + ai.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("LLM API returned status {}: {}", response.statusCode(), response.body());
                throw new LlmException("LLM API error: HTTP " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new LlmException("LLM returned empty content");
            }
            return content.asText();
        } catch (LlmException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new LlmException("LLM request interrupted");
        } catch (Exception ex) {
            log.error("LLM request failed", ex);
            throw new LlmException("LLM request failed: " + ex.getMessage());
        }
    }

    public static class LlmException extends RuntimeException {
        public LlmException(String message) {
            super(message);
        }
    }
}
