# Phase 2 API Documentation

Base URL: `/api/v2`

All endpoints return JSON unless noted. Authentication strategy will be added in Module 2 (initially accepts `externalUserId` in request body for sync from Phase 1 JWT user).

---

## Module 1 — Available Now

### GET /health

Health check for deployment verification.

**Response 200:**
```json
{
  "status": "UP",
  "service": "number-buddies-phase2",
  "timestamp": "2026-07-06T00:00:00+05:30",
  "phase": 2
}
```

---

## Module 2 — Assessment History (Available)

### POST /assessments/sync

Sync a completed Phase 1 assessment into PostgreSQL. Idempotent when `legacyAssessmentId` is provided.

**Response 201:** Full assessment detail including per-question results with mapped topics.

### GET /assessments/history?externalUserId={mongoUserId}

List all synced assessments for a user (newest first).

**Response 200:** Array of summary objects with `id`, `completedAt`, `totalScore`, `accuracy`, `timeTakenMs`, `avgDifficulty`, `assessmentType`.

### GET /assessments/history/{id}?externalUserId={mongoUserId}

Single assessment with full question breakdown.

---

## Module 3 — AI Analysis (Available)

### POST /ai/analyze

Triggers AI (or fallback) analysis for a synced assessment. Idempotent — returns existing report if already generated.

**Request body:**
```json
{
  "assessmentId": "uuid",
  "externalUserId": "mongo-user-id"
}
```

**Response 200:** Structured AI report (see schema below).

### GET /ai/reports/{assessmentId}?externalUserId={mongoUserId}

Fetch a previously generated AI report.

---

### AI Response Schema (strict JSON)

```json
{
  "riskLevel": "MODERATE",
  "weakAreas": ["MULTIPLICATION", "PLACE_VALUE"],
  "strengths": ["ADDITION", "COMPARISON"],
  "summary": "Educational summary text...",
  "parentSuggestions": ["Practice using visual blocks for multiplication..."],
  "teacherSuggestions": ["Use dot arrays for multiplication..."],
  "practicePlan": ["Week 1: Multiplication tables...", "Week 2: Place value..."],
  "disclaimer": "This is an educational screening tool, not a medical diagnosis.",
  "status": "COMPLETED"
}
```

`status` is `COMPLETED` (LLM) or `FALLBACK` (rule-based when AI unavailable).

---

## Module 5 — Practice (Available)

### POST /practice/generate

Generates personalized practice questions. Uses latest AI weak areas if `topics` is omitted.

**Request:**
```json
{
  "externalUserId": "mongo-user-id",
  "topics": ["MULTIPLICATION", "PLACE_VALUE"],
  "difficulty": "EASY|MEDIUM|HARD",
  "countPerTopic": 10,
  "assessmentId": "optional-uuid"
}
```

**Response 201:** Questions without embedded answers + separate `answerKey` map.

### POST /practice/submit

Grade practice answers server-side.

### GET /practice/history?externalUserId={id}

List past practice sessions with scores.

---

## Module 6 — Parent Dashboard (Planned)

### GET /dashboard/parent?externalUserId={id}

Aggregated view: overall score, improvement, weak topics, strengths, AI suggestions, practice schedule.

---

## Module 7 — Progress (Planned)

### GET /progress?externalUserId={id}&period=WEEKLY|MONTHLY

Returns accuracy, average time, improvement, assessment count for charts.

---

## Module 8 — PDF Report (Planned)

### GET /reports/{assessmentId}/pdf

Returns `application/pdf` download.

---

## Error Response Format

```json
{
  "timestamp": "2026-07-06T00:00:00+05:30",
  "status": 400,
  "error": "Bad Request",
  "message": "externalUserId: must not be blank"
}
```
