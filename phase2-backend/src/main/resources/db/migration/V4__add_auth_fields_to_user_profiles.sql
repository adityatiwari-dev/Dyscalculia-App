-- V4: Add authentication and profile registration fields directly to user_profiles
ALTER TABLE user_profiles
ADD COLUMN password VARCHAR(255) NULL,
ADD COLUMN language VARCHAR(100) NULL,
ADD COLUMN educational_board VARCHAR(100) NULL,
ADD COLUMN consent BOOLEAN NULL,
ADD COLUMN consent_date TIMESTAMP NULL;
