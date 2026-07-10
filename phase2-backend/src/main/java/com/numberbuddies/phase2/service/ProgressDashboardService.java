package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.PracticeSession;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.ProgressPeriodType;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.response.ProgressDashboardResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.PracticeSessionRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProgressDashboardService {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final QuestionResultRepository questionResultRepository;

    public ProgressDashboardService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            PracticeSessionRepository practiceSessionRepository,
            QuestionResultRepository questionResultRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.questionResultRepository = questionResultRepository;
    }

    @Transactional(readOnly = true)
    public ProgressDashboardResponse getDashboard(String externalUserId, String periodTypeStr) {
        UserProfile user = userProfileRepository.findByExternalUserId(externalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));

        ProgressPeriodType periodType;
        try {
            periodType = ProgressPeriodType.valueOf(periodTypeStr.toUpperCase());
        } catch (Exception e) {
            periodType = ProgressPeriodType.WEEKLY; // Default fallback
        }

        List<AssessmentRecord> assessments = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        List<PracticeSession> practiceSessions = practiceSessionRepository.findByUser_IdOrderByStartedAtDesc(user.getId());
        List<QuestionResult> questionResults = questionResultRepository.findByAssessment_User_Id(user.getId());

        ProgressDashboardResponse response = new ProgressDashboardResponse();
        response.setTotalAssessments(assessments.size());
        response.setTotalPracticeSessions(practiceSessions.size());

        if (assessments.isEmpty()) {
            response.setBestScore(BigDecimal.ZERO);
            response.setAverageScore(BigDecimal.ZERO);
            response.setLowestScore(BigDecimal.ZERO);
            response.setFastestResponseMs(0L);
            response.setSlowestResponseMs(0L);
            response.setStrongestTopic("—");
            response.setWeakestTopic("—");
            response.setTopicBreakdown(Collections.emptyMap());
            response.setTrends(Collections.emptyList());
            return response;
        }

        // 1. Calculate best, lowest, average scores
        BigDecimal maxScore = BigDecimal.ZERO;
        BigDecimal minScore = BigDecimal.valueOf(100.00);
        BigDecimal sumScore = BigDecimal.ZERO;

        for (AssessmentRecord record : assessments) {
            BigDecimal score = record.getTotalScore();
            if (score.compareTo(maxScore) > 0) maxScore = score;
            if (score.compareTo(minScore) < 0) minScore = score;
            sumScore = sumScore.add(score);
        }

        BigDecimal avgScore = sumScore.divide(BigDecimal.valueOf(assessments.size()), 2, RoundingMode.HALF_UP);
        response.setBestScore(maxScore);
        response.setLowestScore(minScore);
        response.setAverageScore(avgScore);

        // 2. Calculate fastest and slowest response times from QuestionResult entities
        long minResponse = Long.MAX_VALUE;
        long maxResponse = 0L;
        boolean hasValidTimes = false;

        for (QuestionResult q : questionResults) {
            if (q.getResponseTimeMs() != null && q.getResponseTimeMs() > 0) {
                long time = q.getResponseTimeMs();
                if (time < minResponse) minResponse = time;
                if (time > maxResponse) maxResponse = time;
                hasValidTimes = true;
            }
        }

        response.setFastestResponseMs(hasValidTimes ? minResponse : 0L);
        response.setSlowestResponseMs(hasValidTimes ? maxResponse : 0L);

        // 3. Topic Breakdowns and Strongest/Weakest topics
        Map<String, ProgressDashboardResponse.TopicStats> breakdown = new HashMap<>();
        Map<WeakTopic, List<QuestionResult>> byTopic = questionResults.stream()
                .filter(q -> q.getTopic() != null)
                .collect(Collectors.groupingBy(QuestionResult::getTopic));

        String strongest = "—";
        String weakest = "—";
        double maxAccuracy = -1.0;
        double minAccuracy = 101.0;

        for (Map.Entry<WeakTopic, List<QuestionResult>> entry : byTopic.entrySet()) {
            WeakTopic topic = entry.getKey();
            List<QuestionResult> qs = entry.getValue();

            long count = qs.size();
            long correct = qs.stream().filter(QuestionResult::isCorrect).count();
            double accuracy = count == 0 ? 0.0 : (correct * 100.0 / count);

            breakdown.put(topic.name(), new ProgressDashboardResponse.TopicStats(Math.round(accuracy * 100.0) / 100.0, count));

            if (accuracy > maxAccuracy) {
                maxAccuracy = accuracy;
                strongest = topic.name();
            }
            if (accuracy < minAccuracy) {
                minAccuracy = accuracy;
                weakest = topic.name();
            }
        }

        response.setTopicBreakdown(breakdown);
        response.setStrongestTopic(strongest);
        response.setWeakestTopic(weakest);

        // 4. Trend Aggregation (Daily, Weekly, Monthly)
        List<ProgressDashboardResponse.TrendItem> trends = aggregateTrends(assessments, questionResults, periodType);
        response.setTrends(trends);

        return response;
    }

    private List<ProgressDashboardResponse.TrendItem> aggregateTrends(
            List<AssessmentRecord> assessments,
            List<QuestionResult> questionResults,
            ProgressPeriodType periodType
    ) {
        // Map assessments by ID for easy lookup
        Map<UUID, List<QuestionResult>> questionsByAssessment = questionResults.stream()
                .collect(Collectors.groupingBy(q -> q.getAssessment().getId()));

        // Group assessments chronologically
        Map<String, List<AssessmentRecord>> grouped = new TreeMap<>(); // TreeMap keeps label ordering if formatted chronologically

        DateTimeFormatter dailyFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter monthlyFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (AssessmentRecord record : assessments) {
            LocalDate date = record.getCompletedAt().toLocalDate();
            String key;

            if (periodType == ProgressPeriodType.DAILY) {
                key = date.format(dailyFormatter);
            } else if (periodType == ProgressPeriodType.MONTHLY) {
                key = date.format(monthlyFormatter);
            } else {
                // Weekly: Group by the Monday of that week
                LocalDate monday = date.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                key = "Week of " + monday.format(dailyFormatter);
            }

            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(record);
        }

        List<ProgressDashboardResponse.TrendItem> trendItems = new ArrayList<>();

        for (Map.Entry<String, List<AssessmentRecord>> entry : grouped.entrySet()) {
            String label = entry.getKey();
            List<AssessmentRecord> records = entry.getValue();

            // Calculate average accuracy
            double sumAccuracy = 0.0;
            for (AssessmentRecord r : records) {
                sumAccuracy += r.getAccuracy() != null ? r.getAccuracy().doubleValue() : 0.0;
            }
            double avgAccuracy = sumAccuracy / records.size();

            // Calculate average response time in seconds
            long totalTimeMs = 0;
            long questionCount = 0;
            for (AssessmentRecord r : records) {
                List<QuestionResult> qs = questionsByAssessment.getOrDefault(r.getId(), Collections.emptyList());
                for (QuestionResult q : qs) {
                    if (q.getResponseTimeMs() != null && q.getResponseTimeMs() > 0) {
                        totalTimeMs += q.getResponseTimeMs();
                        questionCount++;
                    }
                }
            }

            double avgTimeSeconds = questionCount == 0 ? 0.0 : (totalTimeMs / 1000.0) / questionCount;

            trendItems.add(new ProgressDashboardResponse.TrendItem(
                    label,
                    Math.round(avgAccuracy * 100.0) / 100.0,
                    Math.round(avgTimeSeconds * 100.0) / 100.0
            ));
        }

        // Sort trends: TreeMap naturally keys sorted, but "Week of " key sort needs date extraction or we can sort them by key date extract.
        if (periodType == ProgressPeriodType.WEEKLY) {
            trendItems.sort(Comparator.comparing(item -> {
                String datePart = item.getLabel().replace("Week of ", "");
                return LocalDate.parse(datePart, dailyFormatter);
            }));
        }

        return trendItems;
    }
}
