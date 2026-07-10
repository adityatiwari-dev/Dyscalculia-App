package com.numberbuddies.phase2.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.numberbuddies.phase2.config.AppProperties;
import com.numberbuddies.phase2.domain.entity.AiReport;
import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import com.numberbuddies.phase2.domain.entity.QuestionResult;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.AiReportStatus;
import com.numberbuddies.phase2.domain.enums.RiskLevel;
import com.numberbuddies.phase2.dto.internal.AssessmentAnalysisContext;
import com.numberbuddies.phase2.dto.internal.LlmAnalysisResult;
import com.numberbuddies.phase2.dto.response.AiReportResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AiReportRepository;
import com.numberbuddies.phase2.repository.AssessmentRecordRepository;
import com.numberbuddies.phase2.repository.QuestionResultRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisService.class);

    private final UserProfileRepository userProfileRepository;
    private final AssessmentRecordRepository assessmentRecordRepository;
    private final QuestionResultRepository questionResultRepository;
    private final AiReportRepository aiReportRepository;
    private final WeakAreaDetectionService weakAreaDetectionService;
    private final AiPromptService aiPromptService;
    private final LlmClientService llmClientService;
    private final AiAnalysisFallbackService fallbackService;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public AiAnalysisService(
            UserProfileRepository userProfileRepository,
            AssessmentRecordRepository assessmentRecordRepository,
            QuestionResultRepository questionResultRepository,
            AiReportRepository aiReportRepository,
            WeakAreaDetectionService weakAreaDetectionService,
            AiPromptService aiPromptService,
            LlmClientService llmClientService,
            AiAnalysisFallbackService fallbackService,
            AppProperties appProperties,
            ObjectMapper objectMapper
    ) {
        this.userProfileRepository = userProfileRepository;
        this.assessmentRecordRepository = assessmentRecordRepository;
        this.questionResultRepository = questionResultRepository;
        this.aiReportRepository = aiReportRepository;
        this.weakAreaDetectionService = weakAreaDetectionService;
        this.aiPromptService = aiPromptService;
        this.llmClientService = llmClientService;
        this.fallbackService = fallbackService;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AiReportResponse analyze(UUID assessmentId, String externalUserId) {
        UserProfile user = findUser(externalUserId);
        AssessmentRecord assessment = findOwnedAssessment(assessmentId, user);

        return aiReportRepository.findByAssessment_Id(assessmentId)
                .filter(report -> report.getStatus() == AiReportStatus.COMPLETED
                        || report.getStatus() == AiReportStatus.FALLBACK)
                .map(this::toResponse)
                .orElseGet(() -> generateAndSaveReport(user, assessment));
    }

    @Transactional(readOnly = true)
    public AiReportResponse getReport(UUID assessmentId, String externalUserId) {
        UserProfile user = findUser(externalUserId);
        findOwnedAssessment(assessmentId, user);

        AiReport report = aiReportRepository.findByAssessment_Id(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AI report not found"));

        return toResponse(report);
    }

    private AiReportResponse generateAndSaveReport(UserProfile user, AssessmentRecord assessment) {
        List<QuestionResult> questions = questionResultRepository
                .findByAssessment_IdOrderBySequenceNumberAsc(assessment.getId());

        AssessmentAnalysisContext context = weakAreaDetectionService.buildContext(user, assessment, questions);

        String rawResponse = null;
        LlmAnalysisResult parsed;
        AiReportStatus status;

        try {
            String system = aiPromptService.systemPrompt();
            String userPrompt = aiPromptService.userPrompt(context);
            rawResponse = llmClientService.complete(system, userPrompt);
            parsed = parseLlmJson(rawResponse);
            status = AiReportStatus.COMPLETED;
            log.info("AI analysis completed for assessment {}", assessment.getId());
        } catch (Exception ex) {
            log.warn("AI analysis fallback for assessment {}: {}", assessment.getId(), ex.getMessage());
            parsed = fallbackService.buildFallback(context);
            status = AiReportStatus.FALLBACK;
        }

        AiReport report = aiReportRepository.findByAssessment_Id(assessment.getId())
                .orElse(new AiReport());
        report.setAssessment(assessment);
        report.setUser(user);
        report.setRiskLevel(parseRiskLevel(parsed.getRiskLevel()));
        report.setWeakAreas(safeList(parsed.getWeakAreas()));
        report.setStrengths(safeList(parsed.getStrengths()));
        report.setSummary(parsed.getSummary() != null ? parsed.getSummary() : "");
        report.setParentSuggestions(safeList(parsed.getParentSuggestions()));
        report.setTeacherSuggestions(safeList(parsed.getTeacherSuggestions()));
        report.setPracticePlan(safeList(parsed.getPracticePlan()));
        report.setDisclaimer(appProperties.getDisclaimer());
        report.setStatus(status);
        report.setRawAiResponse(rawResponse);

        AiReport saved = aiReportRepository.save(report);
        return toResponse(saved);
    }

    private LlmAnalysisResult parseLlmJson(String raw) throws Exception {
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
        }
        LlmAnalysisResult result = objectMapper.readValue(cleaned, LlmAnalysisResult.class);
        if (result.getSummary() == null || result.getSummary().isBlank()) {
            throw new IllegalArgumentException("LLM JSON missing summary");
        }
        return result;
    }

    private RiskLevel parseRiskLevel(String value) {
        if (value == null) {
            return RiskLevel.MODERATE;
        }
        try {
            return RiskLevel.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return RiskLevel.MODERATE;
        }
    }

    private List<String> safeList(List<String> list) {
        return list != null ? list : List.of();
    }

    private UserProfile findUser(String externalUserId) {
        return userProfileRepository.findByExternalUserId(externalUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));
    }

    private AssessmentRecord findOwnedAssessment(UUID assessmentId, UserProfile user) {
        AssessmentRecord assessment = assessmentRecordRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assessment not found"));
        if (!assessment.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized to analyze this assessment");
        }
        return assessment;
    }

    private AiReportResponse toResponse(AiReport report) {
        AiReportResponse response = new AiReportResponse();
        response.setId(report.getId());
        response.setAssessmentId(report.getAssessment().getId());
        response.setRiskLevel(report.getRiskLevel());
        response.setWeakAreas(report.getWeakAreas());
        response.setStrengths(report.getStrengths());
        response.setSummary(report.getSummary());
        response.setParentSuggestions(report.getParentSuggestions());
        response.setTeacherSuggestions(report.getTeacherSuggestions());
        response.setPracticePlan(report.getPracticePlan());
        response.setDisclaimer(report.getDisclaimer());
        response.setStatus(report.getStatus());
        response.setCreatedAt(report.getCreatedAt());
        return response;
    }
}
