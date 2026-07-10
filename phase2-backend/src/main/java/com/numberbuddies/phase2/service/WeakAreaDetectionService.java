package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.internal.AssessmentAnalysisContext;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Detects weak and strong educational topics from question-level results.
 * Used as input for AI analysis and as fallback when the LLM is unavailable.
 */
@Service
public class WeakAreaDetectionService {

    private static final double WEAK_THRESHOLD = 60.0;

    public AssessmentAnalysisContext buildContext(
            UserProfile user,
            AssessmentRecord assessment,
            List<QuestionResult> questions
    ) {
        AssessmentAnalysisContext context = new AssessmentAnalysisContext();
        context.setAge(user.getAge());
        context.setGrade(user.getGrade());
        context.setTotalScore(assessment.getTotalScore());
        context.setAccuracy(assessment.getAccuracy());
        context.setTimeTakenMs(assessment.getTimeTakenMs());
        context.setAvgDifficulty(assessment.getAvgDifficulty());
        context.setAssessmentType(assessment.getAssessmentType().name());
        context.setMistakesByTopic(aggregateByTopic(questions));
        context.setQuestionHistory(toQuestionHistory(questions));
        return context;
    }

    public List<String> detectWeakAreas(Map<WeakTopic, AssessmentAnalysisContext.TopicPerformance> byTopic) {
        return byTopic.entrySet().stream()
                .filter(e -> e.getValue().getTotal() > 0 && e.getValue().accuracyPercent() < WEAK_THRESHOLD)
                .sorted(Comparator.comparingDouble(e -> e.getValue().accuracyPercent()))
                .map(e -> e.getKey().name())
                .collect(Collectors.toList());
    }

    public List<String> detectStrengths(Map<WeakTopic, AssessmentAnalysisContext.TopicPerformance> byTopic) {
        return byTopic.entrySet().stream()
                .filter(e -> e.getValue().getTotal() > 0 && e.getValue().accuracyPercent() >= WEAK_THRESHOLD)
                .sorted((a, b) -> Double.compare(b.getValue().accuracyPercent(), a.getValue().accuracyPercent()))
                .map(e -> e.getKey().name())
                .collect(Collectors.toList());
    }

    private Map<WeakTopic, AssessmentAnalysisContext.TopicPerformance> aggregateByTopic(
            List<QuestionResult> questions
    ) {
        Map<WeakTopic, AssessmentAnalysisContext.TopicPerformance> map = new LinkedHashMap<>();
        for (QuestionResult q : questions) {
            WeakTopic topic = q.getTopic() != null ? q.getTopic() : WeakTopic.NUMBER_SENSE;
            AssessmentAnalysisContext.TopicPerformance perf = map.computeIfAbsent(
                    topic,
                    t -> {
                        AssessmentAnalysisContext.TopicPerformance p =
                                new AssessmentAnalysisContext.TopicPerformance();
                        p.setTotal(0);
                        p.setCorrect(0);
                        p.setIncorrect(0);
                        return p;
                    }
            );
            perf.setTotal(perf.getTotal() + 1);
            if (q.isCorrect()) {
                perf.setCorrect(perf.getCorrect() + 1);
            } else {
                perf.setIncorrect(perf.getIncorrect() + 1);
            }
        }
        return map;
    }

    private List<AssessmentAnalysisContext.QuestionHistoryItem> toQuestionHistory(List<QuestionResult> questions) {
        List<AssessmentAnalysisContext.QuestionHistoryItem> items = new ArrayList<>();
        for (QuestionResult q : questions) {
            AssessmentAnalysisContext.QuestionHistoryItem item =
                    new AssessmentAnalysisContext.QuestionHistoryItem();
            item.setSequenceNumber(q.getSequenceNumber());
            item.setTopic(q.getTopic() != null ? q.getTopic().name() : WeakTopic.NUMBER_SENSE.name());
            item.setQuestionText(q.getQuestionText());
            item.setSelectedAnswer(q.getSelectedAnswer());
            item.setCorrectAnswer(q.getCorrectAnswer());
            item.setCorrect(q.isCorrect());
            item.setResponseTimeMs(q.getResponseTimeMs() != null ? q.getResponseTimeMs() : 0L);
            items.add(item);
        }
        return items;
    }
}
