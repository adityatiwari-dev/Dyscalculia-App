package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.AssessmentQuestion;
import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentQuestionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/questions")
public class QuestionController {

    private final AssessmentQuestionRepository repository;

    public QuestionController(AssessmentQuestionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<AssessmentQuestion>> getAllQuestions(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty
    ) {
        if (topic != null && !topic.isBlank() && difficulty != null && !difficulty.isBlank()) {
            return ResponseEntity.ok(repository.findByTopicAndDifficulty(
                    WeakTopic.valueOf(topic.toUpperCase()),
                    DifficultyLevel.valueOf(difficulty.toUpperCase())
            ));
        } else if (topic != null && !topic.isBlank()) {
            return ResponseEntity.ok(repository.findByTopic(WeakTopic.valueOf(topic.toUpperCase())));
        } else if (difficulty != null && !difficulty.isBlank()) {
            return ResponseEntity.ok(repository.findByDifficulty(DifficultyLevel.valueOf(difficulty.toUpperCase())));
        }
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentQuestion> getQuestionById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AssessmentQuestion> createQuestion(@Valid @RequestBody AssessmentQuestion question) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(question));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssessmentQuestion> updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody AssessmentQuestion questionDetails
    ) {
        AssessmentQuestion question = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Question not found"));

        question.setTopic(questionDetails.getTopic());
        question.setDifficulty(questionDetails.getDifficulty());
        question.setQuestionType(questionDetails.getQuestionType());
        question.setQuestionText(questionDetails.getQuestionText());
        question.setOptions(questionDetails.getOptions());
        question.setCorrectAnswer(questionDetails.getCorrectAnswer());

        return ResponseEntity.ok(repository.save(question));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        AssessmentQuestion question = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Question not found"));
        repository.delete(question);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/adaptive")
    public ResponseEntity<AssessmentQuestion> getAdaptiveQuestion(
            @RequestParam int difficultyLevel,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String excludeIds
    ) {
        DifficultyLevel preferredDiff;
        if (difficultyLevel <= 2) {
            preferredDiff = DifficultyLevel.EASY;
        } else if (difficultyLevel == 3) {
            preferredDiff = DifficultyLevel.MEDIUM;
        } else {
            preferredDiff = DifficultyLevel.HARD;
        }

        List<UUID> excludeUuidList = new java.util.ArrayList<>();
        if (excludeIds != null && !excludeIds.isBlank()) {
            for (String s : excludeIds.split(",")) {
                try {
                    excludeUuidList.add(UUID.fromString(s.trim()));
                } catch (IllegalArgumentException e) {
                    // Ignore
                }
            }
        }

        System.out.println("[Adaptive API] excludeIds Param: " + excludeIds);
        System.out.println("[Adaptive API] Exclude UUID List: " + excludeUuidList);

        AssessmentQuestion selected = findAdaptiveQuestion(preferredDiff, topic, excludeUuidList);

        if (selected != null) {
            System.out.println("[Adaptive API] Returned Question ID: " + selected.getId() + " | Text: " + selected.getQuestionText());
            return ResponseEntity.ok(selected);
        }

        System.out.println("[Adaptive API] Returned: 204 No Content (Exhausted)");
        return ResponseEntity.noContent().build();
    }

    private AssessmentQuestion findAdaptiveQuestion(DifficultyLevel preferredDiff, String topicStr, List<UUID> excludeIds) {
        WeakTopic topic = null;
        if (topicStr != null && !topicStr.isBlank()) {
            try {
                topic = WeakTopic.valueOf(topicStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid topic
            }
        }

        // Fetch candidates
        List<AssessmentQuestion> allCandidates;
        if (topic != null) {
            allCandidates = repository.findByTopic(topic);
        } else {
            allCandidates = repository.findAll();
        }

        // Filter out excluded IDs
        List<AssessmentQuestion> freshCandidates = allCandidates.stream()
                .filter(q -> excludeIds == null || !excludeIds.contains(q.getId()))
                .collect(Collectors.toList());

        System.out.println("[Adaptive Debug] Topic: " + topic + " | Total DB Candidates: " + allCandidates.size());
        System.out.println("[Adaptive Debug] Fresh Candidates left: " + freshCandidates.size());

        if (freshCandidates.isEmpty()) {
            return null; // All questions exhausted
        }

        // Group fresh candidates by difficulty level
        Map<DifficultyLevel, List<AssessmentQuestion>> byDiff = freshCandidates.stream()
                .collect(Collectors.groupingBy(AssessmentQuestion::getDifficulty));

        // 1. Try preferred difficulty level
        if (byDiff.containsKey(preferredDiff) && !byDiff.get(preferredDiff).isEmpty()) {
            List<AssessmentQuestion> list = byDiff.get(preferredDiff);
            return list.get((int) (Math.random() * list.size()));
        }

        // 2. Try nearby difficulty levels
        List<DifficultyLevel> fallbackOrder;
        if (preferredDiff == DifficultyLevel.EASY) {
            fallbackOrder = List.of(DifficultyLevel.MEDIUM, DifficultyLevel.HARD);
        } else if (preferredDiff == DifficultyLevel.MEDIUM) {
            fallbackOrder = List.of(DifficultyLevel.EASY, DifficultyLevel.HARD);
        } else {
            fallbackOrder = List.of(DifficultyLevel.MEDIUM, DifficultyLevel.EASY);
        }

        for (DifficultyLevel diff : fallbackOrder) {
            if (byDiff.containsKey(diff) && !byDiff.get(diff).isEmpty()) {
                List<AssessmentQuestion> list = byDiff.get(diff);
                return list.get((int) (Math.random() * list.size()));
            }
        }

        // 3. Last resort fallback
        return freshCandidates.get((int) (Math.random() * freshCandidates.size()));
    }
}
