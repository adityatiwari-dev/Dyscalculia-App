package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.enums.AssessmentType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AssessmentHistorySummaryResponse {

    private UUID id;
    private String legacyAssessmentId;
    private AssessmentType assessmentType;
    private BigDecimal totalScore;
    private BigDecimal accuracy;
    private Long timeTakenMs;
    private BigDecimal avgDifficulty;
    private OffsetDateTime completedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getLegacyAssessmentId() {
        return legacyAssessmentId;
    }

    public void setLegacyAssessmentId(String legacyAssessmentId) {
        this.legacyAssessmentId = legacyAssessmentId;
    }

    public AssessmentType getAssessmentType() {
        return assessmentType;
    }

    public void setAssessmentType(AssessmentType assessmentType) {
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
