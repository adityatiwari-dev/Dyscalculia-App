-- Phase 2 MySQL schema (normalized)
-- Module 1: Foundation tables for assessment history, AI reports, and practice tracking

CREATE TABLE user_profiles (
    id              BINARY(16) PRIMARY KEY,
    external_user_id VARCHAR(64) NOT NULL UNIQUE,
    email           VARCHAR(255),
    name            VARCHAR(255),
    age             INTEGER,
    grade           VARCHAR(50),
    role            VARCHAR(30) NOT NULL DEFAULT 'student',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_external_id ON user_profiles (external_user_id);

CREATE TABLE assessments (
    id                  BINARY(16) PRIMARY KEY,
    user_id             BINARY(16) NOT NULL,
    legacy_assessment_id VARCHAR(64),
    assessment_type     VARCHAR(30) NOT NULL,
    total_score         DECIMAL(5,2) NOT NULL,
    accuracy            DECIMAL(5,2) NOT NULL,
    time_taken_ms       BIGINT NOT NULL DEFAULT 0,
    avg_difficulty      DECIMAL(3,1),
    completed_at        TIMESTAMP NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_assessments_user_id ON assessments (user_id);
CREATE INDEX idx_assessments_completed_at ON assessments (completed_at DESC);

CREATE TABLE question_results (
    id              BINARY(16) PRIMARY KEY,
    assessment_id   BINARY(16) NOT NULL,
    sequence_number INTEGER NOT NULL,
    question_type   VARCHAR(50) NOT NULL,
    topic           VARCHAR(50) NOT NULL,
    question_text   TEXT NOT NULL,
    correct_answer  VARCHAR(255),
    selected_answer VARCHAR(255),
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms BIGINT NOT NULL DEFAULT 0,
    difficulty      INTEGER,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_results_assessment_id ON question_results (assessment_id);
CREATE INDEX idx_question_results_topic ON question_results (topic);

CREATE TABLE ai_reports (
    id                  BINARY(16) PRIMARY KEY,
    assessment_id       BINARY(16) NOT NULL UNIQUE,
    user_id             BINARY(16) NOT NULL,
    risk_level          VARCHAR(20) NOT NULL,
    weak_areas          JSON NOT NULL,
    strengths           JSON NOT NULL,
    summary             TEXT NOT NULL,
    parent_suggestions  JSON NOT NULL,
    teacher_suggestions JSON NOT NULL,
    practice_plan       JSON NOT NULL,
    disclaimer          TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    raw_ai_response     TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_reports_user_id ON ai_reports (user_id);

CREATE TABLE practice_sessions (
    id              BINARY(16) PRIMARY KEY,
    user_id         BINARY(16) NOT NULL,
    topic           VARCHAR(50) NOT NULL,
    difficulty      VARCHAR(20) NOT NULL,
    questions_count INTEGER NOT NULL DEFAULT 0,
    correct_count   INTEGER NOT NULL DEFAULT 0,
    started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions (user_id);

CREATE TABLE practice_questions (
    id              BINARY(16) PRIMARY KEY,
    session_id      BINARY(16) NULL,
    user_id         BINARY(16) NOT NULL,
    topic           VARCHAR(50) NOT NULL,
    difficulty      VARCHAR(20) NOT NULL,
    question_text   TEXT NOT NULL,
    options         JSON NULL,
    correct_answer  VARCHAR(255) NOT NULL,
    user_answer     VARCHAR(255) NULL,
    is_correct      BOOLEAN NULL,
    generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answered_at     TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_practice_questions_user_id ON practice_questions (user_id);
CREATE INDEX idx_practice_questions_topic ON practice_questions (topic);

CREATE TABLE progress_snapshots (
    id               BINARY(16) PRIMARY KEY,
    user_id          BINARY(16) NOT NULL,
    period_type      VARCHAR(20) NOT NULL,
    period_start     DATE NOT NULL,
    period_end       DATE NOT NULL,
    accuracy_avg     DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    time_avg_ms      BIGINT NOT NULL DEFAULT 0,
    assessment_count INTEGER NOT NULL DEFAULT 0,
    improvement_pct  DECIMAL(5,2) NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_period (user_id, period_type, period_start),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_progress_snapshots_user_period ON progress_snapshots (user_id, period_type, period_start);
