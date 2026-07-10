package com.numberbuddies.phase2.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ProgressDashboardResponse {
    private BigDecimal bestScore;
    private BigDecimal averageScore;
    private BigDecimal lowestScore;
    private Long fastestResponseMs;
    private Long slowestResponseMs;
    private Integer totalAssessments;
    private Integer totalPracticeSessions;
    private String strongestTopic;
    private String weakestTopic;
    private Map<String, TopicStats> topicBreakdown;
    private List<TrendItem> trends;

    public BigDecimal getBestScore() {
        return bestScore;
    }

    public void setBestScore(BigDecimal bestScore) {
        this.bestScore = bestScore;
    }

    public BigDecimal getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(BigDecimal averageScore) {
        this.averageScore = averageScore;
    }

    public BigDecimal getLowestScore() {
        return lowestScore;
    }

    public void setLowestScore(BigDecimal lowestScore) {
        this.lowestScore = lowestScore;
    }

    public Long getFastestResponseMs() {
        return fastestResponseMs;
    }

    public void setFastestResponseMs(Long fastestResponseMs) {
        this.fastestResponseMs = fastestResponseMs;
    }

    public Long getSlowestResponseMs() {
        return slowestResponseMs;
    }

    public void setSlowestResponseMs(Long slowestResponseMs) {
        this.slowestResponseMs = slowestResponseMs;
    }

    public Integer getTotalAssessments() {
        return totalAssessments;
    }

    public void setTotalAssessments(Integer totalAssessments) {
        this.totalAssessments = totalAssessments;
    }

    public Integer getTotalPracticeSessions() {
        return totalPracticeSessions;
    }

    public void setTotalPracticeSessions(Integer totalPracticeSessions) {
        this.totalPracticeSessions = totalPracticeSessions;
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

    public Map<String, TopicStats> getTopicBreakdown() {
        return topicBreakdown;
    }

    public void setTopicBreakdown(Map<String, TopicStats> topicBreakdown) {
        this.topicBreakdown = topicBreakdown;
    }

    public List<TrendItem> getTrends() {
        return trends;
    }

    public void setTrends(List<TrendItem> trends) {
        this.trends = trends;
    }

    public static class TopicStats {
        private Double accuracy;
        private Long count;

        public TopicStats() {}

        public TopicStats(Double accuracy, Long count) {
            this.accuracy = accuracy;
            this.count = count;
        }

        public Double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(Double accuracy) {
            this.accuracy = accuracy;
        }

        public Long getCount() {
            return count;
        }

        public void setCount(Long count) {
            this.count = count;
        }
    }

    public static class TrendItem {
        private String label;
        private Double accuracy;
        private Double responseTimeSeconds;

        public TrendItem() {}

        public TrendItem(String label, Double accuracy, Double responseTimeSeconds) {
            this.label = label;
            this.accuracy = accuracy;
            this.responseTimeSeconds = responseTimeSeconds;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public Double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(Double accuracy) {
            this.accuracy = accuracy;
        }

        public Double getResponseTimeSeconds() {
            return responseTimeSeconds;
        }

        public void setResponseTimeSeconds(Double responseTimeSeconds) {
            this.responseTimeSeconds = responseTimeSeconds;
        }
    }
}
