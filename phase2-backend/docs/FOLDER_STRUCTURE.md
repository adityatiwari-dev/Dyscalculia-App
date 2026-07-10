# Phase 2 Backend — Folder Structure

```
phase2-backend/
│
├── pom.xml                          # Maven dependencies
├── README.md                        # Installation guide
├── .env.example                     # Environment variable template
│
├── docs/
│   ├── API.md                       # REST API documentation
│   ├── DATABASE_SCHEMA.md           # PostgreSQL schema reference
│   └── FOLDER_STRUCTURE.md          # This file
│
└── src/main/
    ├── java/com/numberbuddies/phase2/
    │   │
    │   ├── Phase2Application.java   # Spring Boot entry point
    │   │
    │   ├── config/
    │   │   ├── AppProperties.java   # @ConfigurationProperties (AI, CORS)
    │   │   └── WebConfig.java       # CORS filter bean
    │   │
    │   ├── controller/              # REST layer (thin)
    │   │   └── HealthController.java
    │   │   # Module 2+: AssessmentController, AiController, etc.
    │   │
    │   ├── service/                 # Business logic (Module 2+)
    │   │   # AssessmentHistoryService
    │   │   # AiAnalysisService
    │   │   # WeakAreaDetectionService
    │   │   # PracticeGeneratorService
    │   │   # ProgressTrackingService
    │   │   # PdfReportService
    │   │
    │   ├── repository/              # Data access (Spring Data JPA)
    │   │   ├── UserProfileRepository.java
    │   │   ├── AssessmentRecordRepository.java
    │   │   ├── QuestionResultRepository.java
    │   │   ├── AiReportRepository.java
    │   │   ├── PracticeSessionRepository.java
    │   │   ├── PracticeQuestionRepository.java
    │   │   └── ProgressSnapshotRepository.java
    │   │
    │   ├── domain/
    │   │   ├── entity/              # JPA entities (map to PostgreSQL tables)
    │   │   │   ├── UserProfile.java
    │   │   │   ├── AssessmentRecord.java
    │   │   │   ├── QuestionResult.java
    │   │   │   ├── AiReport.java
    │   │   │   ├── PracticeSession.java
    │   │   │   ├── PracticeQuestion.java
    │   │   │   └── ProgressSnapshot.java
    │   │   │
    │   │   └── enums/
    │   │       ├── WeakTopic.java
    │   │       ├── AssessmentType.java
    │   │       ├── DifficultyLevel.java
    │   │       ├── RiskLevel.java
    │   │       ├── AiReportStatus.java
    │   │       └── ProgressPeriodType.java
    │   │
    │   ├── dto/                     # Request/response DTOs (Module 2+)
    │   │   # request/
    │   │   # response/
    │   │
    │   └── exception/
    │       ├── ApiException.java
    │       └── GlobalExceptionHandler.java
    │
    └── resources/
        ├── application.yml          # Spring configuration
        └── db/migration/
            └── V1__initial_schema.sql
```

## Layered Architecture

```
Controller  →  Service  →  Repository  →  Entity  →  PostgreSQL
    ↑              ↑
   DTO          Domain logic, AI calls, validation
```

- **Controllers** handle HTTP, validate DTOs, return responses.
- **Services** contain business rules; no HTTP concerns.
- **Repositories** are Spring Data JPA interfaces only.
- **Entities** map 1:1 to database tables.
- **DTOs** decouple API contracts from persistence model.

## Package Naming Convention

| Package | Responsibility |
|---------|----------------|
| `controller` | `@RestController` classes |
| `service` | `@Service` business logic |
| `repository` | `JpaRepository` interfaces |
| `domain.entity` | `@Entity` classes |
| `domain.enums` | Shared enumerations |
| `dto.request` | Incoming payload records |
| `dto.response` | Outgoing payload records |
| `config` | Spring `@Configuration` |
| `exception` | Error handling |
