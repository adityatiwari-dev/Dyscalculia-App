package com.numberbuddies.phase2.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class ChildSummaryResponse {
    private String externalUserId;
    private String name;
    private String grade;
    private Integer age;
    private BigDecimal overallAccuracy;
    private OffsetDateTime latestAssessmentDate;
    private String strongestTopic;
    private String weakestTopic;
    private String aiRiskLevel;
    private String studentCode;
    private String className;
    private String sectionName;

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }

    public String getExternalUserId() {
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public BigDecimal getOverallAccuracy() {
        return overallAccuracy;
    }

    public void setOverallAccuracy(BigDecimal overallAccuracy) {
        this.overallAccuracy = overallAccuracy;
    }

    public OffsetDateTime getLatestAssessmentDate() {
        return latestAssessmentDate;
    }

    public void setLatestAssessmentDate(OffsetDateTime latestAssessmentDate) {
        this.latestAssessmentDate = latestAssessmentDate;
    }

    public String getStrongestTopic() {
        return strongestTopic;
    }

    public void setStrongestTopic(String strongestTopic) {
        this.strongestTopic = strongestTopic;
    }

    public String getWeakestTopic() {
        return weakestTopic;
    }

    public void setWeakestTopic(String weakestTopic) {
        this.weakestTopic = weakestTopic;
    }

    public String getAiRiskLevel() {
        return aiRiskLevel;
    }

    public void setAiRiskLevel(String aiRiskLevel) {
        this.aiRiskLevel = aiRiskLevel;
    }
}
