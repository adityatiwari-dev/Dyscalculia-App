package com.numberbuddies.phase2.dto.response;

import java.util.List;

public class PracticeSubmitResponse {

    private int totalQuestions;
    private int correctCount;
    private double accuracyPercent;
    private List<PracticeResultItem> results;

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(int correctCount) {
        this.correctCount = correctCount;
    }

    public double getAccuracyPercent() {
        return accuracyPercent;
    }

    public void setAccuracyPercent(double accuracyPercent) {
        this.accuracyPercent = accuracyPercent;
    }

    public List<PracticeResultItem> getResults() {
        return results;
    }

    public void setResults(List<PracticeResultItem> results) {
        this.results = results;
    }

    public static class PracticeResultItem {
        private String questionId;
        private String questionText;
        private String userAnswer;
        private String correctAnswer;
        private boolean correct;

        public String getQuestionId() {
            return questionId;
        }

        public void setQuestionId(String questionId) {
            this.questionId = questionId;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getUserAnswer() {
            return userAnswer;
        }

        public void setUserAnswer(String userAnswer) {
            this.userAnswer = userAnswer;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public void setCorrectAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
        }

        public boolean isCorrect() {
            return correct;
        }

        public void setCorrect(boolean correct) {
            this.correct = correct;
        }
    }
}
