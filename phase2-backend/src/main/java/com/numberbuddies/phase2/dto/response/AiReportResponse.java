package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.enums.AiReportStatus;
import com.numberbuddies.phase2.domain.enums.RiskLevel;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class AiReportResponse {

    private UUID id;
    private UUID assessmentId;
    private RiskLevel riskLevel;
    private List<String> weakAreas;
    private List<String> strengths;
    private String summary;
    private List<String> parentSuggestions;
    private List<String> teacherSuggestions;
    private List<String> practicePlan;
    private String disclaimer;
    private AiReportStatus status;
    private OffsetDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
