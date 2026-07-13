package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LinkChildRequest {

    @NotBlank(message = "Parent external user ID is required")
    private String parentExternalUserId;

    private String childExternalUserId;

    private String studentCode;

    public String getParentExternalUserId() {
        return parentExternalUserId;
    }

    public void setParentExternalUserId(String parentExternalUserId) {
        this.parentExternalUserId = parentExternalUserId;
    }

    public String getChildExternalUserId() {
        return childExternalUserId;
    }

    public void setChildExternalUserId(String childExternalUserId) {
        this.childExternalUserId = childExternalUserId;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
}
