package com.numberbuddies.phase2.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AssessmentSyncRequest {

    private String externalUserId;
    private String userId;

    @Valid
    private UserProfileSyncDto userProfile;

    private String legacyAssessmentId;

    @NotBlank(message = "assessmentType is required")
    private String assessmentType;

    @NotNull(message = "totalScore is required")
    private BigDecimal totalScore;

    @NotNull(message = "accuracy is required")
    private BigDecimal accuracy;

    @NotNull(message = "timeTakenMs is required")
    private Long timeTakenMs;

    private BigDecimal avgDifficulty;

    @NotNull(message = "completedAt is required")
    private OffsetDateTime completedAt;

    @NotEmpty(message = "questions must not be empty")
    @Valid
    private List<QuestionSyncDto> questions;

    public String getExternalUserId() {
        if (externalUserId != null && !externalUserId.isBlank()) {
            return externalUserId.trim();
        }
        if (userId != null && !userId.isBlank()) {
            return userId.trim();
        }
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public UserProfileSyncDto getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfileSyncDto userProfile) {
        this.userProfile = userProfile;
    }

    public String getLegacyAssessmentId() {
        return legacyAssessmentId;
    }

    public void setLegacyAssessmentId(String legacyAssessmentId) {
        this.legacyAssessmentId = legacyAssessmentId;
    }

    public String getAssessmentType() {
        return assessmentType;
    }

    public void setAssessmentType(String assessmentType) {
        this.assessmentType = assessmentType;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(BigDecimal accuracy) {
        this.accuracy = accuracy;
    }

    public Long getTimeTakenMs() {
        return timeTakenMs;
    }

    public void setTimeTakenMs(Long timeTakenMs) {
        this.timeTakenMs = timeTakenMs;
    }

    public BigDecimal getAvgDifficulty() {
        return avgDifficulty;
    }

    public void setAvgDifficulty(BigDecimal avgDifficulty) {
        this.avgDifficulty = avgDifficulty;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public List<QuestionSyncDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionSyncDto> questions) {
        this.questions = questions;
    }
}
