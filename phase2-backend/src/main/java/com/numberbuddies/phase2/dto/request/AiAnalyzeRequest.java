package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AiAnalyzeRequest {

    @NotNull(message = "assessmentId is required")
    private UUID assessmentId;

    @NotBlank(message = "externalUserId is required")
    private String externalUserId;

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }

    public String getExternalUserId() {
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }
}
