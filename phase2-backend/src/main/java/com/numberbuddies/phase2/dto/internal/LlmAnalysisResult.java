package com.numberbuddies.phase2.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Expected JSON shape from the LLM. Must match the prompt schema exactly.
 */
public class LlmAnalysisResult {

    @JsonProperty("riskLevel")
    private String riskLevel;

    @JsonProperty("weakAreas")
    private List<String> weakAreas;

    @JsonProperty("strengths")
    private List<String> strengths;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("parentSuggestions")
    private List<String> parentSuggestions;

    @JsonProperty("teacherSuggestions")
    private List<String> teacherSuggestions;

    @JsonProperty("practicePlan")
    private List<String> practicePlan;

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
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
}
