-- V2: Add parent relationship to user_profiles for Parent Dashboard support
ALTER TABLE user_profiles ADD COLUMN parent_id BINARY(16) NULL;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_parent FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
