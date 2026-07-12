package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ObservationRequest {
    @NotBlank(message = "Student ID is required")
    private String studentExternalUserId;

    @NotBlank(message = "Parent ID is required")
    private String parentExternalUserId;

    @NotBlank(message = "Observation text is required")
    private String observationText;

    public String getStudentExternalUserId() {
        return studentExternalUserId;
    }

    public void setStudentExternalUserId(String studentExternalUserId) {
        this.studentExternalUserId = studentExternalUserId;
    }

    public String getParentExternalUserId() {
        return parentExternalUserId;
    }

    public void setParentExternalUserId(String parentExternalUserId) {
        this.parentExternalUserId = parentExternalUserId;
    }

    public String getObservationText() {
        return observationText;
    }

    public void setObservationText(String observationText) {
        this.observationText = observationText;
    }
}
