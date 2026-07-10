package com.numberbuddies.phase2.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.numberbuddies.phase2.config.AppProperties;
import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.internal.GeneratedPracticeItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Optional AI-powered practice question generation. Falls back to caller on failure.
 */
@Service
public class AiPracticeGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(AiPracticeGeneratorService.class);

    private final LlmClientService llmClientService;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public AiPracticeGeneratorService(
            LlmClientService llmClientService,
            AppProperties appProperties,
            ObjectMapper objectMapper
    ) {
        this.llmClientService = llmClientService;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    public List<GeneratedPracticeItem> tryGenerate(WeakTopic topic, DifficultyLevel difficulty, int count) {
        if (!appProperties.getAi().isEnabled()) {
            throw new LlmClientService.LlmException("AI disabled");
        }

        String system = """
                You generate math practice questions for children.
                Return ONLY valid JSON — no markdown.
                Schema: { "questions": [ { "questionText": "...", "options": ["a","b","c","d"], "correctAnswer": "..." } ] }
                Questions must target the given topic and difficulty. Avoid repeating identical questions.
                """;

        String user = """
                Generate exactly %d unique %s difficulty practice questions for topic: %s.
                Each question must have exactly 4 options and one correctAnswer matching an option.
                """.formatted(count, difficulty.name(), topic.name());

        String raw = llmClientService.complete(system, user);
        return parseQuestions(raw, topic, difficulty);
    }

    private List<GeneratedPracticeItem> parseQuestions(String raw, WeakTopic topic, DifficultyLevel difficulty) {
        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
            }
            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode arr = root.path("questions");
            if (!arr.isArray() || arr.isEmpty()) {
                throw new IllegalArgumentException("No questions in AI response");
            }
            List<GeneratedPracticeItem> items = new ArrayList<>();
            for (JsonNode node : arr) {
                GeneratedPracticeItem item = new GeneratedPracticeItem();
                item.setTopic(topic);
                item.setDifficulty(difficulty);
                item.setQuestionText(node.path("questionText").asText());
                item.setCorrectAnswer(node.path("correctAnswer").asText());
                List<String> options = new ArrayList<>();
                node.path("options").forEach(o -> options.add(o.asText()));
                item.setOptions(options);
                if (item.getQuestionText().isBlank() || item.getCorrectAnswer().isBlank()) {
                    continue;
                }
                items.add(item);
            }
            if (items.isEmpty()) {
                throw new IllegalArgumentException("AI returned no valid questions");
            }
            return items;
        } catch (Exception ex) {
            log.warn("Failed to parse AI practice questions: {}", ex.getMessage());
            throw new LlmClientService.LlmException("Invalid AI practice response");
        }
    }
}
