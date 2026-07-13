package com.numberbuddies.phase2.controller;

import com.numberbuddies.phase2.domain.entity.AssessmentProgress;
import com.numberbuddies.phase2.domain.entity.UserProfile;
import com.numberbuddies.phase2.exception.ApiException;
import com.numberbuddies.phase2.repository.AssessmentProgressRepository;
import com.numberbuddies.phase2.repository.UserProfileRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/assessments/progress")
public class AssessmentResumeController {

    private final AssessmentProgressRepository progressRepository;
    private final UserProfileRepository userProfileRepository;

    public AssessmentResumeController(
            AssessmentProgressRepository progressRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.progressRepository = progressRepository;
        this.userProfileRepository = userProfileRepository;
    }

    private UserProfile resolveUser(String externalUserId) {
        return userProfileRepository.findByExternalUserId(externalUserId)
                .or(() -> userProfileRepository.findByEmail(externalUserId.toLowerCase()))
                .orElseGet(() -> {
                    UserProfile created = new UserProfile();
                    created.setId(UUID.randomUUID());
                    created.setExternalUserId(externalUserId);
                    created.setEmail(externalUserId.contains("@") ? externalUserId.toLowerCase() : externalUserId + "@guest.numberbuddies.com");
                    created.setRole("student");
                    created.setName("Student");
                    return userProfileRepository.save(created);
                });
    }

    @GetMapping
    public ResponseEntity<AssessmentProgress> getProgress(@RequestParam String externalUserId) {
        UserProfile user = resolveUser(externalUserId);

        return progressRepository.findById(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<AssessmentProgress> saveProgress(
            @RequestParam String externalUserId,
            @Valid @RequestBody AssessmentProgress progressRequest
    ) {
        UserProfile user = resolveUser(externalUserId);

        AssessmentProgress progress = progressRepository.findById(user.getId())
                .orElseGet(() -> {
                    AssessmentProgress created = new AssessmentProgress();
                    created.setUserId(user.getId());
                    return created;
                });

        progress.setAssessmentType(progressRequest.getAssessmentType());
        progress.setQuestions(progressRequest.getQuestions());
        progress.setAnswers(progressRequest.getAnswers());
        progress.setCurrentQuestionIndex(progressRequest.getCurrentQuestionIndex());
        progress.setSecondsLeft(progressRequest.getSecondsLeft());
        progress.setDifficulty(progressRequest.getDifficulty());
        progress.setUpdatedAt(OffsetDateTime.now());

        return ResponseEntity.ok(progressRepository.save(progress));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearProgress(@RequestParam String externalUserId) {
        UserProfile user = resolveUser(externalUserId);

        progressRepository.findById(user.getId()).ifPresent(progressRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
