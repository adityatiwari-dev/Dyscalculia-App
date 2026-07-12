-- V9: Create assessment_progress table for saving and resuming active assessment sessions
CREATE TABLE assessment_progress (
    user_id BINARY(16) PRIMARY KEY,
    assessment_type VARCHAR(30) NOT NULL,
    questions JSON NOT NULL,
    answers JSON NOT NULL,
    current_question_index INT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_progress_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);
