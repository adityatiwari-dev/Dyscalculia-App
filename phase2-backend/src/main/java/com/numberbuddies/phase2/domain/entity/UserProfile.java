package com.numberbuddies.phase2.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "teacher", "parent"})
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_user_id", nullable = false, unique = true, length = 64)
    private String externalUserId;

    @Column(length = 255)
    private String email;

    @Column(length = 255)
    private String name;

    private Integer age;

    @Column(length = 50)
    private String grade;

    @Column(nullable = false, length = 30)
    private String role = "student";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(length = 255)
    private String password;

    @Column(length = 100)
    private String language;

    @Column(name = "educational_board", length = 100)
    private String educationalBoard;

    private Boolean consent;

    @Column(name = "consent_date")
    private OffsetDateTime consentDate;

    @Column(name = "student_code", unique = true, length = 32)
    private String studentCode;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (studentCode == null && "student".equalsIgnoreCase(role)) {
            if (externalUserId != null && externalUserId.length() >= 6) {
                studentCode = "NB-" + externalUserId.substring(0, 6).toUpperCase();
            } else if (id != null) {
                studentCode = "NB-" + id.toString().substring(0, 6).toUpperCase();
            } else {
                studentCode = "NB-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            }
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public String getStudentCode() {
        if (studentCode == null && "student".equalsIgnoreCase(role)) {
            if (externalUserId != null && externalUserId.length() >= 6) {
                return "NB-" + externalUserId.substring(0, 6).toUpperCase();
            } else if (id != null) {
                return "NB-" + id.toString().substring(0, 6).toUpperCase();
            }
        }
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
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
        if (role != null && role.toLowerCase().startsWith("role_")) {
            this.role = role.substring(5).toLowerCase();
        } else if (role != null) {
            this.role = role.toLowerCase();
        } else {
            this.role = "student";
        }
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private UserProfile parent;

    @JsonIgnore
    public UserProfile getParent() {
        return parent;
    }

    public void setParent(UserProfile parent) {
        this.parent = parent;
    }

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private UserProfile teacher;

    @JsonIgnore
    public UserProfile getTeacher() {
        return teacher;
    }

    public void setTeacher(UserProfile teacher) {
        this.teacher = teacher;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
}
