-- V14: Add student_code column to user_profiles and create relational link tables parent_student_links and teacher_student_links

-- 1. Add student_code column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN student_code VARCHAR(32) NULL;

-- Populate unique student_code for existing student profiles
UPDATE user_profiles
SET student_code = CONCAT('NB-', UPPER(SUBSTRING(HEX(id), 1, 6)))
WHERE student_code IS NULL AND role = 'student';

-- Add unique constraint/index for student_code
ALTER TABLE user_profiles
ADD CONSTRAINT uk_user_profiles_student_code UNIQUE (student_code);

-- 2. Create parent_student_links table
CREATE TABLE parent_student_links (
    id BINARY(16) NOT NULL PRIMARY KEY,
    parent_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    linked_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_parent_student_parent FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_student_student FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_parent_student_parent_id ON parent_student_links (parent_id);
CREATE INDEX idx_parent_student_student_id ON parent_student_links (student_id);

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
CREATE TABLE teacher_student_links (
    id BINARY(16) NOT NULL PRIMARY KEY,
    teacher_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    class_name VARCHAR(100) NULL,
    section_name VARCHAR(50) NULL,
    linked_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_teacher_student_teacher FOREIGN KEY (teacher_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_student_student FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_teacher_student_teacher_id ON teacher_student_links (teacher_id);
CREATE INDEX idx_teacher_student_student_id ON teacher_student_links (student_id);

-- Migrate existing teacher links from user_profiles to teacher_student_links without data loss
INSERT INTO teacher_student_links (id, teacher_id, student_id, class_name, section_name, linked_at)
SELECT UUID_TO_BIN(UUID()), teacher_id, id, NULL, NULL, CURRENT_TIMESTAMP(6)
FROM user_profiles
WHERE teacher_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM teacher_student_links tsl
      WHERE tsl.teacher_id = user_profiles.teacher_id AND tsl.student_id = user_profiles.id
  );
