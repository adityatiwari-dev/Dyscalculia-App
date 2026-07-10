package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public class PracticeGenerateRequest {

    @NotBlank(message = "externalUserId is required")
    private String externalUserId;

    /** If empty, weak areas are loaded from the latest AI report. */
    private List<String> topics;

    private String difficulty = "MEDIUM";

    @Min(1)
    @Max(20)
    private int countPerTopic = 10;

    /** Optional — use this assessment's AI report for weak topics. */
    private UUID assessmentId;

    public String getExternalUserId() {
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getCountPerTopic() {
        return countPerTopic;
    }

    public void setCountPerTopic(int countPerTopic) {
        this.countPerTopic = countPerTopic;
    }

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }
}
