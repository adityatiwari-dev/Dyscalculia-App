package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.internal.AssessmentAnalysisContext;
import com.numberbuddies.phase2.dto.internal.LlmAnalysisResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Rule-based analysis used when the LLM is disabled, times out, or returns invalid JSON.
 */
@Service
public class AiAnalysisFallbackService {

    private final WeakAreaDetectionService weakAreaDetectionService;

    public AiAnalysisFallbackService(WeakAreaDetectionService weakAreaDetectionService) {
        this.weakAreaDetectionService = weakAreaDetectionService;
    }

    public LlmAnalysisResult buildFallback(AssessmentAnalysisContext context) {
        Map<WeakTopic, AssessmentAnalysisContext.TopicPerformance> byTopic = context.getMistakesByTopic();
        List<String> weakAreas = weakAreaDetectionService.detectWeakAreas(byTopic);
        List<String> strengths = weakAreaDetectionService.detectStrengths(byTopic);

        if (weakAreas.isEmpty() && !byTopic.isEmpty()) {
            weakAreas = List.of(byTopic.keySet().iterator().next().name());
        }
        if (strengths.isEmpty()) {
            strengths = List.of("NUMBER_SENSE");
        }

        LlmAnalysisResult result = new LlmAnalysisResult();
        result.setRiskLevel(resolveRiskLevel(context.getTotalScore()).name());
        result.setWeakAreas(weakAreas);
        result.setStrengths(strengths);
        result.setSummary(buildSummary(context, weakAreas, strengths));
        result.setParentSuggestions(buildParentSuggestions(weakAreas));
        result.setTeacherSuggestions(buildTeacherSuggestions(weakAreas));
        result.setPracticePlan(buildPracticePlan(weakAreas));
        return result;
    }

    private com.numberbuddies.phase2.domain.enums.RiskLevel resolveRiskLevel(BigDecimal totalScore) {
        double score = totalScore != null ? totalScore.doubleValue() : 0;
        if (score < 40) {
            return com.numberbuddies.phase2.domain.enums.RiskLevel.HIGH;
        }
        if (score < 60) {
            return com.numberbuddies.phase2.domain.enums.RiskLevel.MODERATE;
        }
        return com.numberbuddies.phase2.domain.enums.RiskLevel.LOW;
    }

    private String buildSummary(
            AssessmentAnalysisContext context,
            List<String> weakAreas,
            List<String> strengths
    ) {
        return "Based on this %s assessment (score: %s%%), the learner shows strength in %s "
                .formatted(
                        context.getAssessmentType().toLowerCase(),
                        context.getTotalScore(),
                        String.join(", ", strengths)
                )
                + "and may benefit from focused practice in "
                + String.join(", ", weakAreas)
                + ". This is an educational observation, not a medical diagnosis.";
    }

    private List<String> buildParentSuggestions(List<String> weakAreas) {
        List<String> suggestions = new ArrayList<>();
        for (String area : weakAreas) {
            suggestions.add(topicParentSuggestion(area));
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Spend 15 minutes daily on math games that combine visuals and numbers.");
        }
        suggestions.add("Keep practice sessions short (10–15 minutes) and celebrate small improvements.");
        return suggestions;
    }

    private List<String> buildTeacherSuggestions(List<String> weakAreas) {
        List<String> suggestions = new ArrayList<>();
        for (String area : weakAreas) {
            suggestions.add(topicTeacherSuggestion(area));
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Use concrete manipulatives before moving to abstract number work.");
        }
        return suggestions;
    }

    private List<String> buildPracticePlan(List<String> weakAreas) {
        List<String> plan = new ArrayList<>();
        int week = 1;
        for (String area : weakAreas) {
            plan.add("Week %d: Focus on %s — 15 minutes daily using targeted exercises.".formatted(week++, formatTopic(area)));
            if (week > 2) {
                break;
            }
        }
        if (plan.isEmpty()) {
            plan.add("Week 1: Mixed review — 10 easy questions daily across all topics.");
            plan.add("Week 2: Increase difficulty gradually based on accuracy above 70%.");
        } else if (plan.size() == 1) {
            plan.add("Week 2: Review weak areas with visual aids and timed practice.");
        }
        return plan;
    }

    private String topicParentSuggestion(String topic) {
        return switch (topic) {
            case "ADDITION" -> "Practice addition using visual blocks or counters — start with sums under 10.";
            case "SUBTRACTION" -> "Use a number line to model subtraction as 'jumping back' in small steps.";
            case "MULTIPLICATION" -> "Practice multiplication tables using arrays of objects (rows × columns).";
            case "DIVISION" -> "Share groups of objects equally to build division as 'fair sharing'.";
            case "PLACE_VALUE" -> "Use place-value charts and base-ten blocks for tens and hundreds.";
            case "NUMBER_SENSE" -> "Count everyday objects aloud and compare 'more' vs 'less' in daily routines.";
            case "COMPARISON" -> "Compare two numbers using a number line — ask 'which is farther right?'";
            case "PATTERN_RECOGNITION" -> "Create simple number patterns (2, 4, 6…) and ask what comes next.";
            default -> "Spend 15 minutes daily on visual math activities matched to recent mistakes.";
        };
    }

    private String topicTeacherSuggestion(String topic) {
        return switch (topic) {
            case "ADDITION" -> "Start with concrete manipulatives before introducing column addition.";
            case "SUBTRACTION" -> "Teach subtraction as missing-addend problems on a number line.";
            case "MULTIPLICATION" -> "Introduce multiplication as repeated addition with dot arrays.";
            case "DIVISION" -> "Use grouping activities before symbolic division notation.";
            case "PLACE_VALUE" -> "Use expanded form exercises (23 = 20 + 3) before multi-digit operations.";
            case "NUMBER_SENSE" -> "Incorporate dot-counting and subitizing activities in warm-ups.";
            case "COMPARISON" -> "Use balance scales or number lines for greater-than/less-than comparisons.";
            case "PATTERN_RECOGNITION" -> "Use sequence cards and ask students to identify the rule.";
            default -> "Provide scaffolded practice with immediate feedback on missed items.";
        };
    }

    private String formatTopic(String topic) {
        return topic.toLowerCase().replace('_', ' ');
    }
}
