-- V12: Create user_achievements table for student milestone badges
CREATE TABLE user_achievements (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    achievement_key VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_achievement (user_id, achievement_key)
);
