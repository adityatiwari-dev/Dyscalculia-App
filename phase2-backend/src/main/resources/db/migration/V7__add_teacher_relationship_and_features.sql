-- V7: Add teacher relationship to user_profiles table
ALTER TABLE user_profiles ADD COLUMN teacher_id BINARY(16) NULL;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_teacher FOREIGN KEY (teacher_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
