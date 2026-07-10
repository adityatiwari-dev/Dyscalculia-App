package com.numberbuddies.phase2.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.numberbuddies.phase2.dto.internal.AssessmentAnalysisContext;
import org.springframework.stereotype.Service;

@Service
public class AiPromptService {

    private final ObjectMapper objectMapper;

    public AiPromptService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String systemPrompt() {
        return """
                You are an educational math learning assistant for children.
                You analyze arithmetic assessment performance and provide learning recommendations.

                CRITICAL RULES:
                1. You must NEVER diagnose dyscalculia or any medical condition.
                2. Use educational language only: "may benefit from practice", "shows difficulty with".
                3. Return ONLY valid JSON — no markdown, no code fences, no explanation outside JSON.
                4. Suggestions must be specific to the weak areas provided — never generic advice.
                5. riskLevel must be one of: LOW, MODERATE, HIGH (educational support level, not medical).

                Required JSON schema:
                {
                  "riskLevel": "LOW|MODERATE|HIGH",
                  "weakAreas": ["ADDITION","MULTIPLICATION", ...],
                  "strengths": ["COMPARISON", ...],
                  "summary": "2-3 sentence educational summary",
                  "parentSuggestions": ["specific actionable suggestion", ...],
                  "teacherSuggestions": ["specific classroom strategy", ...],
                  "practicePlan": ["Week 1: ...", "Week 2: ...", ...]
                }

                Valid weak area topic values:
                ADDITION, SUBTRACTION, MULTIPLICATION, DIVISION, PLACE_VALUE,
                NUMBER_SENSE, COMPARISON, PATTERN_RECOGNITION
                """;
    }

    public String userPrompt(AssessmentAnalysisContext context) throws JsonProcessingException {
        return """
                Analyze this child's math assessment performance and return ONLY the JSON object.

                Student profile:
                - Age: %s
                - Grade: %s

                Assessment results:
                - Type: %s
                - Score: %s%%
                - Accuracy: %s%%
                - Time taken (ms): %s
                - Average difficulty: %s

                Mistakes by topic (JSON):
                %s

                Question history (JSON):
                %s

                Provide personalized parent suggestions, teacher suggestions, and a 2-week practice plan
                targeting the weakest topics. Include at least 3 items in each suggestions array.
                """.formatted(
                context.getAge() != null ? context.getAge() : "unknown",
                context.getGrade() != null ? context.getGrade() : "unknown",
                context.getAssessmentType(),
                context.getTotalScore(),
                context.getAccuracy(),
                context.getTimeTakenMs(),
                context.getAvgDifficulty() != null ? context.getAvgDifficulty() : "unknown",
                objectMapper.writeValueAsString(context.getMistakesByTopic()),
                objectMapper.writeValueAsString(context.getQuestionHistory())
        );
    }
}
