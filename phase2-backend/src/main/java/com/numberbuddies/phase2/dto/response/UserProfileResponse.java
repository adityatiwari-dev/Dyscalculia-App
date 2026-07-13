package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.entity.UserProfile;
import java.time.OffsetDateTime;
import java.util.UUID;

public class UserProfileResponse {

    private UUID id;
    private String externalUserId;
    private String email;
    private String name;
    private Integer age;
    private String grade;
    private String role;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String language;
    private String educationalBoard;
    private Boolean consent;
    private OffsetDateTime consentDate;
    private String studentCode;

    public static UserProfileResponse fromEntity(UserProfile entity) {
        if (entity == null) {
            return null;
        }
        UserProfileResponse dto = new UserProfileResponse();
        dto.setId(entity.getId());
        dto.setExternalUserId(entity.getExternalUserId());
        dto.setEmail(entity.getEmail());
        dto.setName(entity.getName());
        dto.setAge(entity.getAge());
        dto.setGrade(entity.getGrade());
        dto.setRole(entity.getRole());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setLanguage(entity.getLanguage());
        dto.setEducationalBoard(entity.getEducationalBoard());
        dto.setConsent(entity.getConsent());
        dto.setConsentDate(entity.getConsentDate());
        dto.setStudentCode(entity.getStudentCode());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getExternalUserId() {
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getEducationalBoard() {
        return educationalBoard;
    }

    public void setEducationalBoard(String educationalBoard) {
        this.educationalBoard = educationalBoard;
    }

    public Boolean getConsent() {
        return consent;
    }

    public void setConsent(Boolean consent) {
        this.consent = consent;
    }

    public OffsetDateTime getConsentDate() {
        return consentDate;
    }

    public void setConsentDate(OffsetDateTime consentDate) {
        this.consentDate = consentDate;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
}
