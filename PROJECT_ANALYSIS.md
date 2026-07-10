# Comprehensive Project Analysis: Phase 1 & Phase 2 Backends

This document provides a detailed architectural review of the **Tablet-Based Arithmetic Assessment for Dyscalculia Screening** project. It covers the React frontend, the original Node.js + MongoDB backend, the new Spring Boot + PostgreSQL backend, evaluates their roles, compares their architectures, and recommends integration and migration strategies.

---

## 1. Directory Structure: Combined Project

The repository contains three main folders: `frontend` (React + Vite), `backend` (Express.js), and `phase2-backend` (Spring Boot).

```text
Discalculia-App/
├── backend/                             # Original Phase 1 Backend (Node/Express/MongoDB)
│   ├── config/db.js                     # MongoDB connection
│   ├── controllers/                     # Authentication, Assessment, and User logic
│   ├── middleware/                      # JWT auth and Global Error handling
│   ├── models/                          # Mongoose Schemas (User, Assessment, Result)
│   ├── routes/                          # API endpoint routes
│   └── server.js                        # App entry point
│
├── frontend/                            # React Client (Vite, Tailwind, React Router v6)
│   ├── public/images/                   # Static SVG assets for visual arithmetic
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js                # Axios client targeting Node.js backend
│   │   │   └── springClient.js          # Axios client targeting Spring Boot backend
│   │   ├── components/                  # Reusable UI widgets
│   │   ├── pages/                       # Top-level routes (Assessment, Screening, History, AI Report, Practice)
│   │   └── utils/
│   │       ├── aiAnalysis.js            # Client-side utility for Spring Boot AI calls
│   │       ├── assessmentSync.js        # Syncs MongoDB records to Spring Boot
│   │       └── errorAnalysis.js         # Client-side heuristic error detector
│
└── phase2-backend/                      # New Phase 2 Backend (Spring Boot 3.2.5/PostgreSQL)
    ├── pom.xml                          # Maven dependencies (JPA, Validation, H2/Flyway)
    ├── docs/                            # Database schema, prompt rules, and API docs
    └── src/main/
        ├── java/com/numberbuddies/phase2/
        │   ├── config/                  # AppProperties configurations & CORS Config
        │   ├── controller/              # REST layer (Health, Assessment, AI, Practice)
        │   ├── domain/                  # JPA Entities (UserProfile, QuestionResult, AiReport) & Enums
        │   ├── dto/                     # Request and Response payload definitions
        │   ├── exception/               # GlobalExceptionHandler and custom exceptions
        │   ├── repository/              # Spring Data JPA Repository interfaces
        │   └── service/                 # Core AI grading, practice generation, and topic mapping
        └── resources/
            └── application.yml          # Spring profiles, port, H2 datasource, and AI keys
```

---

## 2. Technical Stack & Component Analysis

### A. React Frontend
* **Core Technologies**: React 19, Vite, React Router DOM v6, Axios, Tailwind CSS.
* **Flows & Pages**:
  * **Adaptive Assessment** ([Assessment.jsx](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/pages/Assessment.jsx)): Serves an 8-question test adjusting difficulty dynamically (+1 if correct and fast, -1 if incorrect).
  * **Quick Domain Screening** ([Screening.jsx](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/pages/Screening.jsx)): Serves 6-question domain-specific evaluations with SpeechSynthesis prompts for auditory support.
  * **Assessment History** ([AssessmentHistory.jsx](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/pages/AssessmentHistory.jsx)): Retrieves historical test submissions from the Spring Boot API.
  * **AI Report Display** ([AiReport.jsx](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/pages/AiReport.jsx)): Shows the cognitive analysis returned by the LLM.
  * **Practice Exercises** ([Practice.jsx](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/pages/Practice.jsx)): Renders personalized learning tasks generated based on weak areas.

### B. Original Node.js Backend
* **Core Technologies**: Node.js, Express, MongoDB (Mongoose ODM), JWT, BCrypt.
* **Responsibilities**:
  * Acts as the primary database of record for authentication and user setup.
  * Grades raw client submissions and stores `Result` documents containing domain scores and heuristic error counts in MongoDB.

### C. New Spring Boot Backend (`phase2-backend`)
* **Core Technologies**: Spring Boot 3.2.5, Spring Data JPA, H2 Database (in-memory, migratable to PostgreSQL), Flyway (schema migrations).
* **Responsibilities**:
  * Syncs completed assessments from Node.js in an idempotent manner using the `legacyAssessmentId`.
  * Integrates with OpenAI-compatible APIs in [AiAnalysisService.java](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/phase2-backend/src/main/java/com/numberbuddies/phase2/service/AiAnalysisService.java) to construct prompts containing student mistakes and generate structured JSON cognitive summaries.
  * Employs [WeakAreaDetectionService.java](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/phase2-backend/src/main/java/com/numberbuddies/phase2/service/WeakAreaDetectionService.java) to group errors into academic categories (`ADDITION`, `PLACE_VALUE`, etc.) and triggers rule-based advice if the LLM fails.
  * Hosts a dynamic practice generator ([PracticeService.java](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/phase2-backend/src/main/java/com/numberbuddies/phase2/service/PracticeService.java)) that feeds the user questions matching their diagnosed weak areas.

---

## 3. Comparison: Node.js vs. Spring Boot

| Feature | Node.js Backend | Spring Boot Backend |
| :--- | :--- | :--- |
| **Language & Safety** | JavaScript (Dynamic, runtime typed) | Java 17 (Static, compilation typed) |
| **Database Style** | MongoDB (NoSQL / Document store) | PostgreSQL (Relational / Normalized) |
| **Code Architecture** | Controller -> Route -> Mongoose Model | Controller -> DTO -> Service -> Repository -> JPA Entity |
| **AI Integration** | None | Native LLM client interface with structured prompts & fallbacks |
| **Data Integrity** | Schema-less (Mongoose enforcement) | Relational constraints (FKs, PKs) + Flyway versioning |
| **Enterprise Readiness**| Moderate (suited for rapid prototyping) | High (scalable, thread-safe, robust security) |

---

## 4. Assessment Synchronization & Flow

When the student submits an assessment, data flows across both backends:

```text
 [React Frontend]                 [Node.js Backend]              [Spring Boot Backend]
        │                                 │                                │
        │ ── POST /api/assessments/sub ─> │                                │
        │    (Grades & saves in Mongo)    │                                │
        │ <── Returns result details ──── │                                │
        │                                                                  │
        │ ────────────────── POST /api/v2/assessments/sync ──────────────> │
        │                    (Syncs user, assessment & question detail)    │
        │ <───────────────── Returns synced assessment detail ──────────── │
        │                                                                  │
        │ ────────────────── POST /api/v2/ai/analyze ─────────────────────> │
        │                    (Triggers LLM review on synced history)       │
        │ <───────────────── Returns cognitive AI report ───────────────── │
```

The synchronization occurs non-blockingly via [assessmentSync.js](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/frontend/src/utils/assessmentSync.js). If the Spring Boot server or AI API experiences an outage, the frontend logs a warning, but the user is still successfully redirected to their standard Results dashboard.

---

## 5. Architectural Recommendation for Phase 2

We strongly recommend **Spring Boot as the primary backend** for the Phase 2 implementation.

### Reasons:
1. **Normalized Data Model**: Cognitive history tracking, question results, practice items, and snapshots are highly relational. Mapping this data to structured PostgreSQL tables prevents the nested-document complexity common in MongoDB.
2. **AI & Prompt Management**: Spring Boot's structured service layer ([AiAnalysisService.java](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/phase2-backend/src/main/java/com/numberbuddies/phase2/service/AiAnalysisService.java)) provides a cleaner separation of prompts, parsing rules, and API fallback configurations.
3. **Data Safety**: Versioned migration scripts (Flyway) ensure that database modifications remain consistent across development environments, preventing data drift.

---

## 6. Migration and Co-existence Strategy

We propose a **two-stage migration path** to integrate these backends without introducing security vulnerabilities or breaking existing code:

### Stage 1: Hybrid Co-existence (Current Implementation)
* **Strategy**: Keep both backends running. Node.js acts as the primary authentication and grading system, while Spring Boot runs as a specialized microservice for analytics, history, practice generation, and AI profiling.
* **Why**: Minimizes changes to the core code and keeps Phase 1 routes stable.

### Stage 2: Full Migration & Deprecation (Recommended Long-Term Goal)
* **Strategy**: Migrate authentication and profile APIs to Spring Boot, copy existing database data, point the React client exclusively to Spring Boot, and deprecate the Node.js backend.
* **Why**: Unifies the infrastructure, removes database duplication, eliminates the synchronization network overhead, and simplifies maintenance.

---

## 7. Functional Gaps and Duplicated Logics

### Duplicated Logic:
* **Scoring Formulas**: Node.js calculates scores in [assessmentController.js](file:///C:/Users/praga/.gemini/antigravity/scratch/Discalculia-App/backend/controllers/assessmentController.js), and frontend utilities duplicate this logic to sync total percentages to Spring Boot.
* **User Accounts**: Profiles are saved both in MongoDB (credentials and roles) and Spring Boot's database (`user_profiles` table).
* **Weakness Analysis**: Heuristics are run in Node to count reversals and confusion, while Spring Boot runs an independent accuracy calculation ($<60\%$) to map questions to cognitive enums.

### Missing APIs in Spring Boot (Required for Full Migration):
* **Authentication**: Token filter validation, registration, login endpoints.
* **User Management**: Parental link configurations, profile updates, teacher-student listings.
* **Direct Grading**: Routes to start assessments and grade results directly on the server.
* **Planned Features**: The parent dashboard (`/api/v2/dashboard/parent`), progress charts (`/api/v2/progress`), and PDF report downloads (`/api/v2/reports/{assessmentId}/pdf`) are planned but not yet implemented in the codebase.
