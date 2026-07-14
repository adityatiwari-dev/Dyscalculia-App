package com.numberbuddies.phase2.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ObservationResponse {
    private UUID id;
    private String parentName;
    private String studentName;
    private String studentExternalUserId;
    private String observationText;
    private OffsetDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentExternalUserId() {
        return studentExternalUserId;
    }

    public void setStudentExternalUserId(String studentExternalUserId) {
        this.studentExternalUserId = studentExternalUserId;
    }

    public String getObservationText() {
        return observationText;
    }

    public void setObservationText(String observationText) {
        this.observationText = observationText;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
