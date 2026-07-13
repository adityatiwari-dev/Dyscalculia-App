package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LinkStudentRequest {

    @NotBlank(message = "Teacher ID is required")
    private String teacherExternalUserId;

    private String studentExternalUserId;

    private String studentCode;

    private String className;

    private String sectionName;

    public String getTeacherExternalUserId() {
        return teacherExternalUserId;
    }

    public void setTeacherExternalUserId(String teacherExternalUserId) {
        this.teacherExternalUserId = teacherExternalUserId;
    }

    public String getStudentExternalUserId() {
        return studentExternalUserId;
    }

    public void setStudentExternalUserId(String studentExternalUserId) {
        this.studentExternalUserId = studentExternalUserId;
    }

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
}
