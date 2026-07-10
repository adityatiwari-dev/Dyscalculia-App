package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LinkChildRequest {

    @NotBlank(message = "Parent external user ID is required")
    private String parentExternalUserId;

    @NotBlank(message = "Child external user ID is required")
    private String childExternalUserId;

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
}
