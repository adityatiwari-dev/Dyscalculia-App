package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LinkStudentRequest {
    @NotBlank(message = "Teacher ID is required")
    private String teacherExternalUserId;

    @NotBlank(message = "Student ID is required")
    private String studentExternalUserId;

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
}
