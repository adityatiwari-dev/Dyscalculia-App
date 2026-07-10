package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.enums.WeakTopic;

import java.util.List;

public class AssessmentHistoryDetailResponse extends AssessmentHistorySummaryResponse {

    private List<QuestionResultResponse> questions;

    public List<QuestionResultResponse> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionResultResponse> questions) {
        this.questions = questions;
    }

    public static class QuestionResultResponse {
        private Integer sequenceNumber;
        private String questionType;
        private WeakTopic topic;
        private String questionText;
        private String correctAnswer;
        private String selectedAnswer;
        private boolean correct;
        private Long responseTimeMs;
        private Integer difficulty;

        public Integer getSequenceNumber() {
            return sequenceNumber;
        }

        public void setSequenceNumber(Integer sequenceNumber) {
            this.sequenceNumber = sequenceNumber;
        }

        public String getQuestionType() {
            return questionType;
        }

        public void setQuestionType(String questionType) {
            this.questionType = questionType;
        }

        public WeakTopic getTopic() {
            return topic;
        }

        public void setTopic(WeakTopic topic) {
            this.topic = topic;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public void setCorrectAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
        }

        public String getSelectedAnswer() {
            return selectedAnswer;
        }

        public void setSelectedAnswer(String selectedAnswer) {
            this.selectedAnswer = selectedAnswer;
        }

        public boolean isCorrect() {
            return correct;
        }

        public void setCorrect(boolean correct) {
            this.correct = correct;
        }

        public Long getResponseTimeMs() {
            return responseTimeMs;
        }

        public void setResponseTimeMs(Long responseTimeMs) {
            this.responseTimeMs = responseTimeMs;
        }

        public Integer getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(Integer difficulty) {
            this.difficulty = difficulty;
        }
    }
}
