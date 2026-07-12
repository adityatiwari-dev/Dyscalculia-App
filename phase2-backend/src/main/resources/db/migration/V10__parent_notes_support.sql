-- V10: Create parent_observations table for parents to store student behavior observation notes
CREATE TABLE parent_observations (
    id BINARY(16) PRIMARY KEY,
    student_id BINARY(16) NOT NULL,
    parent_id BINARY(16) NOT NULL,
    observation_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_observations_student FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_observations_parent FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);
