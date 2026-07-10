-- V6: Convert remaining enum-mapped VARCHAR columns to native MySQL ENUM columns to satisfy Hibernate validation

-- 1. Safely normalize and update existing data to uppercase enums
UPDATE assessments SET assessment_type = UPPER(TRIM(assessment_type)) WHERE assessment_type IS NOT NULL;

UPDATE practice_questions SET topic = UPPER(TRIM(topic)) WHERE topic IS NOT NULL;
UPDATE practice_questions SET difficulty = UPPER(TRIM(difficulty)) WHERE difficulty IS NOT NULL;

UPDATE practice_sessions SET topic = UPPER(TRIM(topic)) WHERE topic IS NOT NULL;
UPDATE practice_sessions SET difficulty = UPPER(TRIM(difficulty)) WHERE difficulty IS NOT NULL;

UPDATE question_results SET topic = UPPER(TRIM(topic)) WHERE topic IS NOT NULL;

-- 2. Establish defaults/fallbacks for any empty, NULL, or unrecognized values to prevent migration failure
UPDATE assessments SET assessment_type = 'SCREENING' WHERE assessment_type NOT IN ('FULL', 'SCREENING', 'PRACTICE') OR assessment_type IS NULL;

UPDATE practice_questions SET topic = 'NUMBER_SENSE' WHERE topic NOT IN ('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') OR topic IS NULL;
UPDATE practice_questions SET difficulty = 'MEDIUM' WHERE difficulty NOT IN ('EASY', 'MEDIUM', 'HARD') OR difficulty IS NULL;

UPDATE practice_sessions SET topic = 'NUMBER_SENSE' WHERE topic NOT IN ('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') OR topic IS NULL;
UPDATE practice_sessions SET difficulty = 'MEDIUM' WHERE difficulty NOT IN ('EASY', 'MEDIUM', 'HARD') OR difficulty IS NULL;

UPDATE question_results SET topic = 'NUMBER_SENSE' WHERE topic NOT IN ('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') OR topic IS NULL;

-- 3. Modify columns to native ENUM type
ALTER TABLE assessments MODIFY COLUMN assessment_type ENUM('FULL', 'SCREENING', 'PRACTICE') NOT NULL;

ALTER TABLE practice_questions MODIFY COLUMN topic ENUM('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') NOT NULL;
ALTER TABLE practice_questions MODIFY COLUMN difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL;

ALTER TABLE practice_sessions MODIFY COLUMN topic ENUM('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') NOT NULL;
ALTER TABLE practice_sessions MODIFY COLUMN difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL;

ALTER TABLE question_results MODIFY COLUMN topic ENUM('ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION') NOT NULL;
