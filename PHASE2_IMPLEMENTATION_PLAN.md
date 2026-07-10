# Phase 2 Implementation Plan

**Project:** Tablet-Based Arithmetic Assessment for Dyscalculia Screening  
**Goal:** Extend the existing app into an AI-assisted personalized learning platform  
**Constraint:** Existing Node.js + MongoDB assessment flow must remain unchanged.

---

## Architecture Strategy (Backward Compatible)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING (Phase 1) — UNCHANGED                │
│  React Frontend ──▶ Node/Express API ──▶ MongoDB                 │
│  Auth, Assessment, Screening, Results, CSV Export                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ After successful submit (Phase 2 hook)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEW (Phase 2) — ADDITIVE ONLY                 │
│  React Frontend ──▶ Spring Boot API ──▶ PostgreSQL               │
│  History, AI Analysis, Practice, Parent Dashboard, PDF Reports   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                         LLM API (OpenAI / compatible)
```

### Integration Rules

1. **No changes** to existing scoring logic in `backend/controllers/assessmentController.js`.
2. **No removal** of existing React pages or routes.
3. Phase 2 frontend uses a **separate API client** (`springClient.js`) pointing to Spring Boot.
4. After existing `POST /api/assessments/submit` succeeds, frontend **optionally** calls Spring Boot to sync history and trigger AI analysis.
5. If Spring Boot or AI is unavailable, the existing Results page still works.

### Medical Disclaimer

All AI outputs include: *"This is an educational screening tool, not a medical diagnosis."*

---

## Module Breakdown

| Module | Scope | Touches Existing Code? |
|--------|-------|------------------------|
| **M1** | Spring Boot scaffold + PostgreSQL schema + Flyway | **No** — new `phase2-backend/` folder only |
| **M2** | Assessment History APIs + sync DTOs | **Minimal** — add optional sync call in Assessment/Screening after submit |
| **M3** | AI Analysis service + LLM prompt + structured JSON | No (backend only) |
| **M4** | Weak area detection + topic mapping utility | No (backend only) |
| **M5** | Practice question generator (AI + fallback) | No (backend only) |
| **M6** | Parent Dashboard page (React) | **Add only** — new page + Navbar link |
| **M7** | Progress tracking APIs + charts | Add new components/pages |
| **M8** | AI Report + PDF export | Add new page + backend endpoint |
| **M9** | Frontend integration polish + env config | Add `springClient.js`, `.env.example` |
| **M10** | Documentation + deployment guides | Add README files |

---

## Database Schema (PostgreSQL)

See `phase2-backend/docs/DATABASE_SCHEMA.md` (created in Module 1).

**Tables:** `user_profiles`, `assessments`, `question_results`, `ai_reports`, `practice_questions`, `practice_sessions`, `progress_snapshots`

---

## Weak Area Topics (Enum)

| Topic | Maps From Existing Question Types |
|-------|-----------------------------------|
| ADDITION | arithmetic (+) |
| SUBTRACTION | arithmetic (−) — future |
| MULTIPLICATION | arithmetic (×) |
| DIVISION | arithmetic (÷) — future |
| PLACE_VALUE | number_sense transcoding |
| NUMBER_SENSE | count_dots, missing |
| COMPARISON | comparison |
| PATTERN_RECOGNITION | missing sequences, memory |

---

## API Prefix (Spring Boot)

Base URL: `/api/v2`

| Method | Endpoint | Module |
|--------|----------|--------|
| GET | `/health` | M1 |
| POST | `/assessments/sync` | M2 |
| GET | `/assessments/history` | M2 |
| GET | `/assessments/history/{id}` | M2 |
| POST | `/ai/analyze` | M3 |
| GET | `/ai/reports/{assessmentId}` | M3 |
| POST | `/practice/generate` | M5 |
| GET | `/practice/history` | M5 |
| GET | `/dashboard/parent` | M6 |
| GET | `/progress` | M7 |
| GET | `/reports/{assessmentId}/pdf` | M8 |

---

## Current Status

- [x] **Module 1** — Spring Boot foundation + PostgreSQL schema
- [x] **Module 2** — Assessment History APIs + frontend sync + History page
- [x] **Module 3** — AI Analysis service + LLM prompt + fallback + AiReport page
- [x] **Module 5** — Practice question generator + Practice page (awaiting confirmation for M6)

---

*Last updated: July 6, 2026*
