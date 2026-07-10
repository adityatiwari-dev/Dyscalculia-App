package com.numberbuddies.phase2.domain.entity;

import com.numberbuddies.phase2.domain.enums.AiReportStatus;
import com.numberbuddies.phase2.domain.enums.RiskLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_reports")
public class AiReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false, unique = true)
    private AssessmentRecord assessment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserProfile user;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weak_areas", nullable = false, columnDefinition = "json")
    private List<String> weakAreas = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "json")
    private List<String> strengths = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parent_suggestions", nullable = false, columnDefinition = "json")
    private List<String> parentSuggestions = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "teacher_suggestions", nullable = false, columnDefinition = "json")
    private List<String> teacherSuggestions = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "practice_plan", nullable = false, columnDefinition = "json")
    private List<String> practicePlan = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String disclaimer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiReportStatus status = AiReportStatus.PENDING;

    @Column(name = "raw_ai_response", columnDefinition = "TEXT")
    private String rawAiResponse;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public AssessmentRecord getAssessment() {
        return assessment;
    }

    public void setAssessment(AssessmentRecord assessment) {
        this.assessment = assessment;
    }

    public UserProfile getUser() {
        return user;
    }

    public void setUser(UserProfile user) {
        this.user = user;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public List<String> getWeakAreas() {
        return weakAreas;
    }

    public void setWeakAreas(List<String> weakAreas) {
        this.weakAreas = weakAreas;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getParentSuggestions() {
        return parentSuggestions;
    }

    public void setParentSuggestions(List<String> parentSuggestions) {
        this.parentSuggestions = parentSuggestions;
    }

    public List<String> getTeacherSuggestions() {
        return teacherSuggestions;
    }

    public void setTeacherSuggestions(List<String> teacherSuggestions) {
        this.teacherSuggestions = teacherSuggestions;
    }

    public List<String> getPracticePlan() {
        return practicePlan;
    }

    public void setPracticePlan(List<String> practicePlan) {
        this.practicePlan = practicePlan;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public AiReportStatus getStatus() {
        return status;
    }

    public void setStatus(AiReportStatus status) {
        this.status = status;
    }

    public String getRawAiResponse() {
        return rawAiResponse;
    }

    public void setRawAiResponse(String rawAiResponse) {
        this.rawAiResponse = rawAiResponse;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
