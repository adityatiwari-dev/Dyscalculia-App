-- V14: Add student_code column to user_profiles and create relational link tables parent_student_links and teacher_student_links

-- 1. Add student_code column to user_profiles table if not exists
DROP PROCEDURE IF EXISTS add_student_code_col;
DELIMITER //
CREATE PROCEDURE add_student_code_col()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'user_profiles'
          AND COLUMN_NAME = 'student_code'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN student_code VARCHAR(32) NULL;
    END IF;
END //
DELIMITER ;
CALL add_student_code_col();
DROP PROCEDURE IF EXISTS add_student_code_col;

-- Populate unique student_code for existing student profiles
UPDATE user_profiles
SET student_code = CONCAT('NB-', UPPER(SUBSTRING(HEX(id), 1, 6)))
WHERE student_code IS NULL AND role = 'student';

-- Add unique constraint/index for student_code if not exists
DROP PROCEDURE IF EXISTS add_student_code_uk;
DELIMITER //
CREATE PROCEDURE add_student_code_uk()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'user_profiles'
          AND INDEX_NAME = 'uk_user_profiles_student_code'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT uk_user_profiles_student_code UNIQUE (student_code);
    END IF;
END //
DELIMITER ;
CALL add_student_code_uk();
DROP PROCEDURE IF EXISTS add_student_code_uk;

-- 2. Create parent_student_links table
CREATE TABLE IF NOT EXISTS parent_student_links (
    id BINARY(16) NOT NULL PRIMARY KEY,
    parent_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    linked_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_parent_student_parent FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_student_student FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Migrate existing parent links from user_profiles to parent_student_links without data loss
INSERT INTO parent_student_links (id, parent_id, student_id, linked_at)
SELECT UUID_TO_BIN(UUID()), parent_id, id, CURRENT_TIMESTAMP(6)
FROM user_profiles
WHERE parent_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM parent_student_links psl
      WHERE psl.parent_id = user_profiles.parent_id AND psl.student_id = user_profiles.id
  );

-- 3. Create teacher_student_links table
CREATE TABLE IF NOT EXISTS teacher_student_links (
    id BINARY(16) NOT NULL PRIMARY KEY,
    teacher_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    class_name VARCHAR(100) NULL,
    section_name VARCHAR(50) NULL,
    linked_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_teacher_student_teacher FOREIGN KEY (teacher_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_student_student FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Migrate existing teacher links from user_profiles to teacher_student_links without data loss
INSERT INTO teacher_student_links (id, teacher_id, student_id, class_name, section_name, linked_at)
SELECT UUID_TO_BIN(UUID()), teacher_id, id, NULL, NULL, CURRENT_TIMESTAMP(6)
FROM user_profiles
WHERE teacher_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM teacher_student_links tsl
      WHERE tsl.teacher_id = user_profiles.teacher_id AND tsl.student_id = user_profiles.id
  );
