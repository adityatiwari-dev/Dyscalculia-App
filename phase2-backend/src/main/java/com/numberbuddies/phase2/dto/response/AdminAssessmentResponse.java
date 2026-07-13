package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.entity.AssessmentRecord;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AdminAssessmentResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String legacyAssessmentId;
    private String assessmentType;
    private BigDecimal totalScore;
    private BigDecimal accuracy;
    private Long timeTakenMs;
    private BigDecimal avgDifficulty;
    private OffsetDateTime completedAt;

    public static AdminAssessmentResponse fromEntity(AssessmentRecord record) {
        if (record == null) {
            return null;
        }
        AdminAssessmentResponse dto = new AdminAssessmentResponse();
        dto.setId(record.getId());
        if (record.getUser() != null) {
            dto.setUserId(record.getUser().getId());
            dto.setUserName(record.getUser().getName());
            dto.setUserEmail(record.getUser().getEmail());
        }
        dto.setLegacyAssessmentId(record.getLegacyAssessmentId());
        dto.setAssessmentType(record.getAssessmentType() != null ? record.getAssessmentType().name() : null);
        dto.setTotalScore(record.getTotalScore());
        dto.setAccuracy(record.getAccuracy());
        dto.setTimeTakenMs(record.getTimeTakenMs());
        dto.setAvgDifficulty(record.getAvgDifficulty());
        dto.setCompletedAt(record.getCompletedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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
}
