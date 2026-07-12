-- V13: Add seconds_left and difficulty columns to assessment_progress for full resume capability
ALTER TABLE assessment_progress
ADD COLUMN seconds_left INT DEFAULT 20,
ADD COLUMN difficulty INT DEFAULT 2;
