# Database Schema — Phase 2 (PostgreSQL)

Normalized schema for assessment history, AI reports, practice tracking, and progress analytics.

## Entity Relationship Diagram

```
user_profiles (1) ──< (N) assessments
user_profiles (1) ──< (N) ai_reports
user_profiles (1) ──< (N) practice_sessions
user_profiles (1) ──< (N) practice_questions
user_profiles (1) ──< (N) progress_snapshots

assessments (1) ──< (N) question_results
assessments (1) ─── (1) ai_reports

practice_sessions (1) ──< (N) practice_questions
```

## Tables

### user_profiles

Links Phase 2 PostgreSQL users to Phase 1 MongoDB users via `external_user_id`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Internal Phase 2 ID |
| external_user_id | VARCHAR(64) UNIQUE | MongoDB `_id` from Phase 1 |
| email, name, age, grade | — | Copied/synced from registration |
| role | VARCHAR(30) | student, parent, teacher, admin |
| created_at, updated_at | TIMESTAMPTZ | Audit |

### assessments

One row per completed assessment (full or screening).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | → user_profiles |
| legacy_assessment_id | VARCHAR(64) | MongoDB assessment ID (optional) |
| assessment_type | VARCHAR(30) | FULL, SCREENING, PRACTICE |
| total_score | NUMERIC(5,2) | 0–100 |
| accuracy | NUMERIC(5,2) | Same as score or per-question accuracy |
| time_taken_ms | BIGINT | Total response time |
| avg_difficulty | NUMERIC(3,1) | Average question difficulty |
| completed_at | TIMESTAMPTZ | When assessment finished |

### question_results

Per-question detail for weak-area analysis.

| Column | Type | Notes |
|--------|------|-------|
| assessment_id | UUID FK | |
| sequence_number | INTEGER | Question order |
| question_type | VARCHAR(50) | e.g. arithmetic, number_sense |
| topic | VARCHAR(50) | WeakTopic enum (ADDITION, etc.) |
| question_text | TEXT | |
| correct_answer, selected_answer | VARCHAR | |
| is_correct | BOOLEAN | |
| response_time_ms | BIGINT | |
| difficulty | INTEGER | 1–5 |

### ai_reports

Structured AI analysis output (one per assessment).

| Column | Type | Notes |
|--------|------|-------|
| assessment_id | UUID FK UNIQUE | |
| risk_level | VARCHAR(20) | LOW, MODERATE, HIGH (educational, not medical) |
| weak_areas, strengths | JSONB | String arrays |
| summary | TEXT | |
| parent_suggestions, teacher_suggestions, practice_plan | JSONB | String arrays |
| disclaimer | TEXT | Required non-diagnosis disclaimer |
| status | VARCHAR(20) | PENDING, COMPLETED, FAILED, FALLBACK |
| raw_ai_response | TEXT | Full LLM response for audit |

### practice_sessions

Groups practice question attempts by topic and difficulty.

### practice_questions

Individual generated practice items with answers stored separately from question text in API responses.

### progress_snapshots

Pre-aggregated weekly/monthly metrics for chart rendering.

## Migration

Flyway script: `src/main/resources/db/migration/V1__initial_schema.sql`

Run automatically on application startup when `spring.flyway.enabled=true`.

## Weak Topic Enum Values

`ADDITION`, `SUBTRACTION`, `MULTIPLICATION`, `DIVISION`, `PLACE_VALUE`, `NUMBER_SENSE`, `COMPARISON`, `PATTERN_RECOGNITION`
