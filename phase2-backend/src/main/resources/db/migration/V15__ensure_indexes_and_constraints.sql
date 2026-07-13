-- V15: Ensure indexes exist for parent_student_links and teacher_student_links safely

DROP PROCEDURE IF EXISTS ensure_idx_psl_parent;
DELIMITER //
CREATE PROCEDURE ensure_idx_psl_parent()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'parent_student_links'
          AND INDEX_NAME = 'idx_parent_student_parent_id'
    ) THEN
        CREATE INDEX idx_parent_student_parent_id ON parent_student_links (parent_id);
    END IF;
END //
DELIMITER ;
CALL ensure_idx_psl_parent();
DROP PROCEDURE IF EXISTS ensure_idx_psl_parent;

DROP PROCEDURE IF EXISTS ensure_idx_psl_student;
DELIMITER //
CREATE PROCEDURE ensure_idx_psl_student()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'parent_student_links'
          AND INDEX_NAME = 'idx_parent_student_student_id'
    ) THEN
        CREATE INDEX idx_parent_student_student_id ON parent_student_links (student_id);
    END IF;
END //
DELIMITER ;
CALL ensure_idx_psl_student();
DROP PROCEDURE IF EXISTS ensure_idx_psl_student;

DROP PROCEDURE IF EXISTS ensure_idx_tsl_teacher;
DELIMITER //
CREATE PROCEDURE ensure_idx_tsl_teacher()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'teacher_student_links'
          AND INDEX_NAME = 'idx_teacher_student_teacher_id'
    ) THEN
        CREATE INDEX idx_teacher_student_teacher_id ON teacher_student_links (teacher_id);
    END IF;
END //
DELIMITER ;
CALL ensure_idx_tsl_teacher();
DROP PROCEDURE IF EXISTS ensure_idx_tsl_teacher;

DROP PROCEDURE IF EXISTS ensure_idx_tsl_student;
DELIMITER //
CREATE PROCEDURE ensure_idx_tsl_student()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'teacher_student_links'
          AND INDEX_NAME = 'idx_teacher_student_student_id'
    ) THEN
        CREATE INDEX idx_teacher_student_student_id ON teacher_student_links (student_id);
    END IF;
END //
DELIMITER ;
CALL ensure_idx_tsl_student();
DROP PROCEDURE IF EXISTS ensure_idx_tsl_student;
