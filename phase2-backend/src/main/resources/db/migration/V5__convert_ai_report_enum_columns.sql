-- V5: Convert ai_reports VARCHAR columns to native MySQL ENUM columns to align with Hibernate 6 validation requirements

-- 1. Safely normalize and update existing data to uppercase enums before altering columns
UPDATE ai_reports SET risk_level = UPPER(TRIM(risk_level)) WHERE risk_level IS NOT NULL;
UPDATE ai_reports SET status = UPPER(TRIM(status)) WHERE status IS NOT NULL;

-- 2. Establish defaults for any empty, NULL, or unrecognized values to prevent migration failure
UPDATE ai_reports SET risk_level = 'LOW' WHERE risk_level NOT IN ('LOW', 'MODERATE', 'HIGH') OR risk_level IS NULL;
UPDATE ai_reports SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'COMPLETED', 'FAILED', 'FALLBACK') OR status IS NULL;

-- 3. Alter risk_level to ENUM column
ALTER TABLE ai_reports MODIFY COLUMN risk_level ENUM('LOW', 'MODERATE', 'HIGH') NOT NULL;

-- 4. Alter status to ENUM column with PENDING as default
ALTER TABLE ai_reports MODIFY COLUMN status ENUM('PENDING', 'COMPLETED', 'FAILED', 'FALLBACK') NOT NULL DEFAULT 'PENDING';
