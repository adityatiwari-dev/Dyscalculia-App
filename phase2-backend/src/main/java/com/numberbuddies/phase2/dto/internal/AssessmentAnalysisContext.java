package com.numberbuddies.phase2.dto.internal;

import com.numberbuddies.phase2.domain.enums.WeakTopic;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AssessmentAnalysisContext {

    private Integer age;
    private String grade;
    private BigDecimal totalScore;
    private BigDecimal accuracy;
    private Long timeTakenMs;
    private BigDecimal avgDifficulty;
    private String assessmentType;
    private Map<WeakTopic, TopicPerformance> mistakesByTopic = new LinkedHashMap<>();
    private List<QuestionHistoryItem> questionHistory = new ArrayList<>();

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(BigDecimal accuracy) {
        this.accuracy = accuracy;
    }

    public Long getTimeTakenMs() {
        return timeTakenMs;
    }

    public void setTimeTakenMs(Long timeTakenMs) {
        this.timeTakenMs = timeTakenMs;
    }

    public BigDecimal getAvgDifficulty() {
        return avgDifficulty;
    }

    public void setAvgDifficulty(BigDecimal avgDifficulty) {
        this.avgDifficulty = avgDifficulty;
    }

    public String getAssessmentType() {
        return assessmentType;
    }

    public void setAssessmentType(String assessmentType) {
        this.assessmentType = assessmentType;
    }

    public Map<WeakTopic, TopicPerformance> getMistakesByTopic() {
        return mistakesByTopic;
    }

    public void setMistakesByTopic(Map<WeakTopic, TopicPerformance> mistakesByTopic) {
        this.mistakesByTopic = mistakesByTopic;
    }

    public List<QuestionHistoryItem> getQuestionHistory() {
        return questionHistory;
    }

    public void setQuestionHistory(List<QuestionHistoryItem> questionHistory) {
        this.questionHistory = questionHistory;
    }

    public static class TopicPerformance {
        private int total;
        private int incorrect;
        private int correct;

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public int getIncorrect() {
            return incorrect;
        }

        public void setIncorrect(int incorrect) {
            this.incorrect = incorrect;
        }

        public int getCorrect() {
            return correct;
        }

        public void setCorrect(int correct) {
            this.correct = correct;
        }

        public double accuracyPercent() {
            return total == 0 ? 0 : (correct * 100.0) / total;
        }
    }

    public static class QuestionHistoryItem {
        private int sequenceNumber;
        private String topic;
        private String questionText;
        private String selectedAnswer;
        private String correctAnswer;
        private boolean correct;
        private long responseTimeMs;

        public int getSequenceNumber() {
            return sequenceNumber;
        }

        public void setSequenceNumber(int sequenceNumber) {
            this.sequenceNumber = sequenceNumber;
        }

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getSelectedAnswer() {
            return selectedAnswer;
        }

        public void setSelectedAnswer(String selectedAnswer) {
            this.selectedAnswer = selectedAnswer;
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

        public long getResponseTimeMs() {
            return responseTimeMs;
        }

        public void setResponseTimeMs(long responseTimeMs) {
            this.responseTimeMs = responseTimeMs;
        }
    }
}
