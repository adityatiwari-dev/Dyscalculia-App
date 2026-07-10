package com.numberbuddies.phase2.dto.response;

import com.numberbuddies.phase2.domain.enums.DifficultyLevel;
import com.numberbuddies.phase2.domain.enums.WeakTopic;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class PracticeGenerateResponse {

    private UUID sessionId;
    private List<String> topics;
    private DifficultyLevel difficulty;
    private List<PracticeQuestionDto> questions;
    /** Answers kept separate from question objects — reveal only during review. */
    private Map<UUID, String> answerKey = new LinkedHashMap<>();
    private boolean generatedByAi;

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public DifficultyLevel getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyLevel difficulty) {
        this.difficulty = difficulty;
    }

    public List<PracticeQuestionDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<PracticeQuestionDto> questions) {
        this.questions = questions;
    }

    public Map<UUID, String> getAnswerKey() {
        return answerKey;
    }

    public void setAnswerKey(Map<UUID, String> answerKey) {
        this.answerKey = answerKey;
    }

    public boolean isGeneratedByAi() {
        return generatedByAi;
    }

    public void setGeneratedByAi(boolean generatedByAi) {
        this.generatedByAi = generatedByAi;
    }

    public static class PracticeQuestionDto {
        private UUID id;
        private WeakTopic topic;
        private DifficultyLevel difficulty;
        private String questionText;
        private List<String> options;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public WeakTopic getTopic() {
            return topic;
        }

        public void setTopic(WeakTopic topic) {
            this.topic = topic;
        }

        public DifficultyLevel getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(DifficultyLevel difficulty) {
            this.difficulty = difficulty;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public List<String> getOptions() {
            return options;
        }

        public void setOptions(List<String> options) {
            this.options = options;
        }
    }
}
