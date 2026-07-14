package com.numberbuddies.phase2.service;

import com.numberbuddies.phase2.domain.entity.AiReport;
import com.numberbuddies.phase2.domain.entity.PracticeQuestion;
import com.numberbuddies.phase2.domain.entity.PracticeSession;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.dto.internal.GeneratedPracticeItem;
import com.numberbuddies.phase2.dto.request.PracticeGenerateRequest;
import com.numberbuddies.phase2.dto.request.PracticeSubmitRequest;
import com.numberbuddies.phase2.dto.response.PracticeGenerateResponse;
import com.numberbuddies.phase2.dto.response.PracticeSessionSummaryResponse;
import com.numberbuddies.phase2.dto.response.PracticeSubmitResponse;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AiReportRepository;
import com.numberbuddies.phase2.repository.PracticeQuestionRepository;
import com.numberbuddies.phase2.repository.PracticeSessionRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PracticeService {

    private final UserProfileRepository userProfileRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final PracticeQuestionRepository practiceQuestionRepository;
    private final AiReportRepository aiReportRepository;
    private final RuleBasedPracticeGenerator ruleBasedGenerator;
    private final AiPracticeGeneratorService aiPracticeGeneratorService;

    public PracticeService(
            UserProfileRepository userProfileRepository,
            PracticeSessionRepository practiceSessionRepository,
            PracticeQuestionRepository practiceQuestionRepository,
            AiReportRepository aiReportRepository,
            RuleBasedPracticeGenerator ruleBasedGenerator,
            AiPracticeGeneratorService aiPracticeGeneratorService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.practiceQuestionRepository = practiceQuestionRepository;
        this.aiReportRepository = aiReportRepository;
        this.ruleBasedGenerator = ruleBasedGenerator;
        this.aiPracticeGeneratorService = aiPracticeGeneratorService;
    }

    @Transactional
    public PracticeGenerateResponse generate(PracticeGenerateRequest request) {
        UserProfile user = findUser(request.getExternalUserId());
        DifficultyLevel difficulty = parseDifficulty(request.getDifficulty());
        List<WeakTopic> topics = resolveTopics(request, user);

        if (topics.isEmpty()) {
            topics = List.of(WeakTopic.ADDITION, WeakTopic.NUMBER_SENSE);
        }

        PracticeSession session = new PracticeSession();
        session.setUser(user);
        session.setTopic(topics.get(0));
        session.setDifficulty(difficulty);
        session.setQuestionsCount(0);
        session.setCorrectCount(0);
        PracticeSession savedSession = practiceSessionRepository.save(session);

        List<PracticeGenerateResponse.PracticeQuestionDto> questionDtos = new ArrayList<>();
        Map<UUID, String> answerKey = new LinkedHashMap<>();
        boolean anyAi = false;
        int totalQuestions = 0;

        for (WeakTopic topic : topics) {
            List<GeneratedPracticeItem> generated = generateForTopic(topic, difficulty, request.getCountPerTopic());
            for (GeneratedPracticeItem item : generated) {
                PracticeQuestion entity = new PracticeQuestion();
                entity.setSession(savedSession);
                entity.setUser(user);
                entity.setTopic(item.getTopic());
                entity.setDifficulty(item.getDifficulty());
                entity.setQuestionText(item.getQuestionText());
                entity.setOptions(item.getOptions());
                entity.setCorrectAnswer(item.getCorrectAnswer());
                entity.setGeneratedByAi(item.isAiGenerated());
                if (item.isAiGenerated()) {
                    anyAi = true;
                }
                PracticeQuestion saved = practiceQuestionRepository.save(entity);

                PracticeGenerateResponse.PracticeQuestionDto dto = new PracticeGenerateResponse.PracticeQuestionDto();
                dto.setId(saved.getId());
                dto.setTopic(saved.getTopic());
                dto.setDifficulty(saved.getDifficulty());
                dto.setQuestionText(saved.getQuestionText());
                dto.setOptions(saved.getOptions());
                questionDtos.add(dto);
                answerKey.put(saved.getId(), saved.getCorrectAnswer());
                totalQuestions++;
            }
        }

        savedSession.setQuestionsCount(totalQuestions);
        practiceSessionRepository.save(savedSession);

        PracticeGenerateResponse response = new PracticeGenerateResponse();
        response.setSessionId(savedSession.getId());
        response.setTopics(topics.stream().map(Enum::name).collect(Collectors.toList()));
        response.setDifficulty(difficulty);
        response.setQuestions(questionDtos);
        response.setAnswerKey(answerKey);
        response.setGeneratedByAi(anyAi);
        return response;
    }

    @Transactional
    public PracticeSubmitResponse submit(PracticeSubmitRequest request) {
        UserProfile user = findUser(request.getExternalUserId());
        PracticeSession session = practiceSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Practice session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized");
        }

        Map<UUID, PracticeQuestion> questionMap = practiceQuestionRepository
                .findBySession_IdOrderByCreatedAtAsc(session.getId())
                .stream()
                .collect(Collectors.toMap(PracticeQuestion::getId, q -> q));

        int correct = 0;
        List<PracticeSubmitResponse.PracticeResultItem> results = new ArrayList<>();

        for (PracticeSubmitRequest.PracticeAnswerDto answer : request.getAnswers()) {
            PracticeQuestion q = questionMap.get(answer.getQuestionId());
            if (q == null) continue;

            String userAnswer = answer.getUserAnswer() != null ? answer.getUserAnswer().trim() : "";
            boolean isCorrect = !userAnswer.isEmpty()
                    && userAnswer.equalsIgnoreCase(String.valueOf(q.getCorrectAnswer()).trim());

            q.setUserAnswer(userAnswer);
            q.setCorrect(isCorrect);
            q.setAnsweredAt(OffsetDateTime.now());
            practiceQuestionRepository.save(q);

            if (isCorrect) correct++;

            PracticeSubmitResponse.PracticeResultItem item = new PracticeSubmitResponse.PracticeResultItem();
            item.setQuestionId(q.getId().toString());
            item.setQuestionText(q.getQuestionText());
            item.setUserAnswer(userAnswer);
            item.setCorrectAnswer(q.getCorrectAnswer());
            item.setCorrect(isCorrect);
            results.add(item);
        }

        session.setCorrectCount(correct);
        session.setCompletedAt(OffsetDateTime.now());
        practiceSessionRepository.save(session);

        int total = session.getQuestionsCount() != null ? session.getQuestionsCount() : results.size();
        PracticeSubmitResponse response = new PracticeSubmitResponse();
        response.setTotalQuestions(total);
        response.setCorrectCount(correct);
        response.setAccuracyPercent(total == 0 ? 0 : Math.round((correct * 100.0 / total) * 100.0) / 100.0);
        response.setResults(results);
        return response;
    }

    @Transactional(readOnly = true)
    public List<PracticeSessionSummaryResponse> getHistory(String externalUserId) {
        UserProfile user = findUser(externalUserId);
        return practiceSessionRepository.findByUser_IdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    private List<GeneratedPracticeItem> generateForTopic(
            WeakTopic topic,
            DifficultyLevel difficulty,
            int count
    ) {
        try {
            List<GeneratedPracticeItem> aiItems = aiPracticeGeneratorService.tryGenerate(topic, difficulty, count);
            aiItems.forEach(i -> i.setAiGenerated(true));
            if (aiItems.size() >= count) {
                return aiItems.subList(0, count);
            }
            List<GeneratedPracticeItem> combined = new ArrayList<>(aiItems);
            combined.addAll(ruleBasedGenerator.generate(topic, difficulty, count - aiItems.size()));
            return combined;
        } catch (Exception ex) {
            List<GeneratedPracticeItem> items = ruleBasedGenerator.generate(topic, difficulty, count);
            items.forEach(i -> i.setAiGenerated(false));
            return items;
        }
    }

    private List<WeakTopic> resolveTopics(PracticeGenerateRequest request, UserProfile user) {
        if (request.getTopics() != null && !request.getTopics().isEmpty()) {
            return request.getTopics().stream()
                    .map(this::parseTopic)
                    .collect(Collectors.toList());
        }

        if (request.getAssessmentId() != null) {
            return aiReportRepository.findByAssessment_Id(request.getAssessmentId())
                    .map(AiReport::getWeakAreas)
                    .filter(list -> list != null && !list.isEmpty())
                    .map(list -> list.stream().map(this::parseTopic).collect(Collectors.toList()))
                    .orElse(List.of());
        }

        return aiReportRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .findFirst()
                .map(AiReport::getWeakAreas)
                .filter(list -> list != null && !list.isEmpty())
                .map(list -> list.stream().map(this::parseTopic).limit(3).collect(Collectors.toList()))
                .orElse(List.of());
    }

    private WeakTopic parseTopic(String value) {
        try {
            return WeakTopic.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid topic: " + value);
        }
    }

    private DifficultyLevel parseDifficulty(String value) {
        try {
            return DifficultyLevel.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid difficulty: " + value);
        }
    }

    private UserProfile findUser(String externalUserId) {
        if (externalUserId == null || externalUserId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "externalUserId or userId is required");
        }
        return userProfileRepository.findByExternalUserId(externalUserId)
                .or(() -> {
                    try {
                        return userProfileRepository.findById(java.util.UUID.fromString(externalUserId));
                    } catch (Exception e) {
                        return java.util.Optional.empty();
                    }
                })
                .or(() -> userProfileRepository.findByEmail(externalUserId.toLowerCase()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User profile not found"));
    }

    private PracticeSessionSummaryResponse toSummary(PracticeSession session) {
        PracticeSessionSummaryResponse response = new PracticeSessionSummaryResponse();
        response.setSessionId(session.getId());
        response.setTopic(session.getTopic());
        response.setDifficulty(session.getDifficulty());
        response.setQuestionsCount(session.getQuestionsCount());
        response.setCorrectCount(session.getCorrectCount());
        response.setStartedAt(session.getStartedAt());
        response.setCompletedAt(session.getCompletedAt());
        return response;
    }
}
