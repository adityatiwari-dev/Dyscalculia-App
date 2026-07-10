package com.numberbuddies.phase2.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class PracticeSubmitRequest {

    @NotNull(message = "sessionId is required")
    private UUID sessionId;

    @NotBlank(message = "externalUserId is required")
    private String externalUserId;

    @NotNull(message = "answers is required")
    private List<PracticeAnswerDto> answers;

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public String getExternalUserId() {
        return externalUserId;
    }

    public void setExternalUserId(String externalUserId) {
        this.externalUserId = externalUserId;
    }

    public List<PracticeAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<PracticeAnswerDto> answers) {
        this.answers = answers;
    }

    public static class PracticeAnswerDto {
        @NotNull(message = "questionId is required")
        private UUID questionId;

        private String userAnswer;

        public UUID getQuestionId() {
            return questionId;
        }

        public void setQuestionId(UUID questionId) {
            this.questionId = questionId;
        }

        public String getUserAnswer() {
            return userAnswer;
        }

        public void setUserAnswer(String userAnswer) {
            this.userAnswer = userAnswer;
        }
    }
}
