package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.AssessmentType;
import com.numberbuddies.phase2.dto.request.AssessmentSyncRequest;
import com.numberbuddies.phase2.dto.request.QuestionSyncDto;
import com.numberbuddies.phase2.dto.request.UserProfileSyncDto;
import com.numberbuddies.phase2.dto.request.UserProfileSyncRequest;
import com.numberbuddies.phase2.dto.response.AssessmentHistoryDetailResponse;
import com.numberbuddies.phase2.dto.response.AssessmentHistorySummaryResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import com.numberbuddies.phase2.repository.AiReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssessmentHistoryService {

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final QuestionResultRepository questionResultRepository;
    private final AiReportRepository aiReportRepository;
    private final TopicMapperService topicMapperService;
    private final UserService userService;

    public AssessmentHistoryService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            QuestionResultRepository questionResultRepository,
            AiReportRepository aiReportRepository,
            TopicMapperService topicMapperService,
            UserService userService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.questionResultRepository = questionResultRepository;
        this.aiReportRepository = aiReportRepository;
        this.topicMapperService = topicMapperService;
        this.userService = userService;
    }

    @Transactional
    public AssessmentHistoryDetailResponse syncAssessment(AssessmentSyncRequest request) {
        if (request.getLegacyAssessmentId() != null && !request.getLegacyAssessmentId().isBlank()) {
            return assessmentRecordRepository.findByLegacyAssessmentId(request.getLegacyAssessmentId())
                    .map(existing -> getAssessmentDetail(existing.getId(), request.getExternalUserId()))
                    .orElseGet(() -> createAssessment(request));
        }
        return createAssessment(request);
    }

    @Transactional(readOnly = true)
    public List<AssessmentHistorySummaryResponse> getHistory(String externalUserId) {
        UserProfile user = findUserByExternalId(externalUserId);
        return assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssessmentHistoryDetailResponse getAssessmentDetail(UUID assessmentId, String externalUserId) {
        UserProfile user = findUserByExternalId(externalUserId);
        AssessmentRecord record = assessmentRecordRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assessment not found"));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to view this assessment");
        }

        return toDetail(record);
    }

    private AssessmentHistoryDetailResponse createAssessment(AssessmentSyncRequest request) {
        UserProfile user = upsertUserProfile(request.getExternalUserId(), request.getUserProfile());

        AssessmentRecord record = new AssessmentRecord();
        record.setUser(user);
        record.setLegacyAssessmentId(request.getLegacyAssessmentId());
        record.setAssessmentType(parseAssessmentType(request.getAssessmentType()));
        record.setTotalScore(request.getTotalScore());
        record.setAccuracy(request.getAccuracy());
        record.setTimeTakenMs(request.getTimeTakenMs());
        record.setAvgDifficulty(request.getAvgDifficulty());
        record.setCompletedAt(request.getCompletedAt());

        AssessmentRecord saved = assessmentRecordRepository.save(record);

        List<QuestionResult> questionResults = request.getQuestions().stream()
                .map(dto -> toQuestionResult(saved, dto))
                .collect(Collectors.toList());
        questionResultRepository.saveAll(questionResults);

        return toDetail(saved);
    }

    private UserProfile upsertUserProfile(String externalUserId, UserProfileSyncDto profileDto) {
        UserProfileSyncRequest syncRequest = new UserProfileSyncRequest();
        syncRequest.setExternalUserId(externalUserId);
        if (profileDto != null) {
            syncRequest.setEmail(profileDto.getEmail());
            syncRequest.setName(profileDto.getName());
            syncRequest.setAge(profileDto.getAge());
            syncRequest.setGrade(profileDto.getGrade());
            syncRequest.setRole(profileDto.getRole());
        }
        return userService.syncUser(syncRequest);
    }

    private QuestionResult toQuestionResult(AssessmentRecord assessment, QuestionSyncDto dto) {
        QuestionResult result = new QuestionResult();
        result.setAssessment(assessment);
        result.setSequenceNumber(dto.getSequenceNumber());
        result.setQuestionType(dto.getQuestionType());
        result.setTopic(topicMapperService.map(dto.getQuestionType(), dto.getQuestionText(), dto.getSubtype()));
        result.setQuestionText(dto.getQuestionText());
        result.setCorrectAnswer(dto.getCorrectAnswer());
        result.setSelectedAnswer(dto.getSelectedAnswer());
        result.setCorrect(Boolean.TRUE.equals(dto.getIsCorrect()));
        result.setResponseTimeMs(dto.getResponseTimeMs() != null ? dto.getResponseTimeMs() : 0L);
        result.setDifficulty(dto.getDifficulty());
        return result;
    }

    private AssessmentType parseAssessmentType(String value) {
        if (value == null) return AssessmentType.SCREENING;
        String upper = value.toUpperCase();
        if (upper.contains("ADAPTIVE") || upper.contains("SCREEN")) return AssessmentType.SCREENING;
        if (upper.contains("FULL")) return AssessmentType.FULL;
        if (upper.contains("PRACTICE")) return AssessmentType.PRACTICE;
        try {
            return AssessmentType.valueOf(upper);
        } catch (IllegalArgumentException ex) {
            return AssessmentType.SCREENING;
        }
    }

    private UserProfile findUserByExternalId(String externalUserId) {
        if (externalUserId == null || externalUserId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "externalUserId or userId is required");
        }
        return userProfileRepository.findByExternalUserId(externalUserId)
                .or(() -> {
                    try {
                        return userProfileRepository.findById(UUID.fromString(externalUserId));
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .or(() -> userProfileRepository.findByEmail(externalUserId.toLowerCase()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));
    }

    private AssessmentHistorySummaryResponse toSummary(AssessmentRecord record) {
        AssessmentHistorySummaryResponse response = new AssessmentHistorySummaryResponse();
        response.setId(record.getId());
        response.setLegacyAssessmentId(record.getLegacyAssessmentId());
        response.setAssessmentType(record.getAssessmentType());
        response.setTotalScore(record.getTotalScore());
        response.setAccuracy(record.getAccuracy());
        response.setTimeTakenMs(record.getTimeTakenMs());
        response.setAvgDifficulty(record.getAvgDifficulty());
        response.setCompletedAt(record.getCompletedAt());
        return response;
    }

    private AssessmentHistoryDetailResponse toDetail(AssessmentRecord record) {
        AssessmentHistoryDetailResponse response = new AssessmentHistoryDetailResponse();
        AssessmentHistorySummaryResponse summary = toSummary(record);
        response.setId(summary.getId());
        response.setLegacyAssessmentId(summary.getLegacyAssessmentId());
        response.setAssessmentType(summary.getAssessmentType());
        response.setTotalScore(summary.getTotalScore());
        response.setAccuracy(summary.getAccuracy());
        response.setTimeTakenMs(summary.getTimeTakenMs());
        response.setAvgDifficulty(summary.getAvgDifficulty());
        response.setCompletedAt(summary.getCompletedAt());

        List<AssessmentHistoryDetailResponse.QuestionResultResponse> questions =
                questionResultRepository.findByAssessment_IdOrderBySequenceNumberAsc(record.getId())
                        .stream()
                        .map(this::toQuestionResponse)
                        .collect(Collectors.toList());
        response.setQuestions(questions);
        return response;
    }

    private AssessmentHistoryDetailResponse.QuestionResultResponse toQuestionResponse(QuestionResult result) {
        AssessmentHistoryDetailResponse.QuestionResultResponse response =
                new AssessmentHistoryDetailResponse.QuestionResultResponse();
        response.setSequenceNumber(result.getSequenceNumber());
        response.setQuestionType(result.getQuestionType());
        response.setTopic(result.getTopic());
        response.setQuestionText(result.getQuestionText());
        response.setCorrectAnswer(result.getCorrectAnswer());
        response.setSelectedAnswer(result.getSelectedAnswer());
        response.setCorrect(result.isCorrect());
        response.setResponseTimeMs(result.getResponseTimeMs());
        response.setDifficulty(result.getDifficulty());
        return response;
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getDetailedResults(String authName, String emailParam, String externalUserIdParam) {
        UserProfile user = null;
        if (externalUserIdParam != null && !externalUserIdParam.isBlank()) {
            user = userProfileRepository.findByExternalUserId(externalUserIdParam).orElse(null);
        }
        if (user == null && emailParam != null && !emailParam.isBlank()) {
            user = userProfileRepository.findByEmail(emailParam.toLowerCase()).orElse(null);
        }
        if (user == null && authName != null && !authName.isBlank()) {
            user = userProfileRepository.findByEmail(authName.toLowerCase())
                    .or(() -> userProfileRepository.findByExternalUserId(authName))
                    .orElse(null);
        }
        if (user == null) {
            return java.util.Collections.emptyList();
        }

        List<AssessmentRecord> records = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());

        java.util.List<java.util.Map<String, Object>> resultsList = new java.util.ArrayList<>();

        for (AssessmentRecord record : records) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("_id", record.getId().toString());
            map.put("legacyAssessmentId", record.getLegacyAssessmentId());
            map.put("assessmentType", record.getAssessmentType().name());
            map.put("totalScore", record.getTotalScore());
            map.put("accuracy", record.getAccuracy());
            map.put("timeTakenMs", record.getTimeTakenMs());
            map.put("avgDifficulty", record.getAvgDifficulty());
            map.put("createdAt", record.getCompletedAt().toString());
            map.put("completedAt", record.getCompletedAt().toString());

            String risk = "LOW";
            var reportOpt = aiReportRepository.findByAssessment_Id(record.getId());
            if (reportOpt.isPresent()) {
                risk = reportOpt.get().getRiskLevel().name();
            }
            map.put("dyscalculiaRiskIndex", risk);
            map.put("confidenceScore", 85.0);

            List<QuestionResult> questionResults = questionResultRepository.findByAssessment_IdOrderBySequenceNumberAsc(record.getId());

            map.put("scores", calculateDomainScores(questionResults, record.getTotalScore().doubleValue()));

            java.util.List<java.util.Map<String, Object>> questions = new java.util.ArrayList<>();
            java.util.List<java.util.Map<String, Object>> answers = new java.util.ArrayList<>();

            for (QuestionResult qr : questionResults) {
                java.util.Map<String, Object> qMap = new java.util.HashMap<>();
                qMap.put("questionText", qr.getQuestionText());
                qMap.put("correctAnswer", qr.getCorrectAnswer());
                qMap.put("questionType", qr.getQuestionType());
                questions.add(qMap);

                java.util.Map<String, Object> aMap = new java.util.HashMap<>();
                aMap.put("selected", qr.getSelectedAnswer());
                aMap.put("selectedAnswer", qr.getSelectedAnswer());
                aMap.put("responseTime", qr.getResponseTimeMs());
                answers.add(aMap);
            }
            map.put("questions", questions);
            map.put("answers", answers);
            map.put("subtypeCounts", new java.util.HashMap<>());

            resultsList.add(map);
        }

        return resultsList;
    }

    private java.util.Map<String, Double> calculateDomainScores(List<QuestionResult> questionResults, double totalScore) {
        java.util.Map<String, Integer> total = new java.util.HashMap<>();
        java.util.Map<String, Integer> correct = new java.util.HashMap<>();

        for (QuestionResult qr : questionResults) {
            String domain = "general";
            String qType = qr.getQuestionType() != null ? qr.getQuestionType().toLowerCase() : "";
            String topic = qr.getTopic() != null ? qr.getTopic().name().toLowerCase() : "";

            if (topic.contains("addition") || topic.contains("subtraction") || topic.contains("multiplication") || topic.contains("division")
                    || qType.contains("arithmetic") || qType.contains("addition") || qType.contains("subtraction")) {
                domain = "arithmetic";
            } else if (topic.contains("comparison") || topic.contains("place_value") || topic.contains("number_sense")
                    || qType.contains("sense") || qType.contains("dot") || qType.contains("comparison") || qType.contains("line") || qType.contains("place")) {
                domain = "number_sense";
            } else if (qType.contains("spatial") || qType.contains("geometry") || qType.contains("shape") || qType.contains("color") || topic.contains("spatial")) {
                domain = "spatial";
            } else if (qType.contains("memory") || qType.contains("sequence") || qType.contains("pattern") || topic.contains("pattern") || topic.contains("memory")) {
                domain = "memory";
            }

            if ("general".equals(domain)) {
                domain = "number_sense"; // Default fallback
            }

            total.put(domain, total.getOrDefault(domain, 0) + 1);
            if (qr.isCorrect()) {
                correct.put(domain, correct.getOrDefault(domain, 0) + 1);
            }
        }

        java.util.Map<String, Double> scores = new java.util.HashMap<>();
        scores.put("total", totalScore);
        scores.put("number_sense", 0.0);
        scores.put("arithmetic", 0.0);
        scores.put("spatial", 0.0);
        scores.put("memory", 0.0);

        for (String domain : total.keySet()) {
            if (scores.containsKey(domain)) {
                double accuracy = (correct.getOrDefault(domain, 0) * 100.0) / total.get(domain);
                scores.put(domain, Math.round(accuracy * 100.0) / 100.0);
            }
        }
        return scores;
    }

    @Transactional(readOnly = true)
    public String exportCsv(String email) {
        UserProfile user = userProfileRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));

        List<AssessmentRecord> records = assessmentRecordRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());

        StringBuilder csv = new StringBuilder();
        csv.append("Assessment ID,Learner Name,Completed Date,Total Score,Accuracy,Time Taken (s),Avg Difficulty,Risk Level\n");

        for (AssessmentRecord record : records) {
            String risk = "LOW";
            var reportOpt = aiReportRepository.findByAssessment_Id(record.getId());
            if (reportOpt.isPresent()) {
                risk = reportOpt.get().getRiskLevel().name();
            }

            csv.append(record.getId().toString()).append(",")
                    .append(escapeCsvField(record.getUser().getName())).append(",")
                    .append(record.getCompletedAt().toString()).append(",")
                    .append(record.getTotalScore()).append(",")
                    .append(record.getAccuracy()).append(",")
                    .append(record.getTimeTakenMs() / 1000.0).append(",")
                    .append(record.getAvgDifficulty() != null ? record.getAvgDifficulty() : "0.0").append(",")
                    .append(risk).append("\n");
        }

        return csv.toString();
    }

    private String escapeCsvField(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}
