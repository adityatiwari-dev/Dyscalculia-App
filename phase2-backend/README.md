# Number Buddies — Phase 2 Backend

Spring Boot API for AI-assisted personalized learning. This service **extends** the existing Node.js/MongoDB app without replacing it.

## Tech Stack

- Java 17
- Spring Boot 3.2
- Spring Data JPA
- PostgreSQL
- Flyway (schema migrations)

## Folder Structure

```
phase2-backend/
├── pom.xml
├── README.md
├── docs/
│   ├── API.md
│   ├── DATABASE_SCHEMA.md
│   └── FOLDER_STRUCTURE.md
└── src/main/
    ├── java/com/numberbuddies/phase2/
    │   ├── Phase2Application.java
    │   ├── config/           # CORS, app properties
    │   ├── controller/       # REST controllers
    │   ├── service/          # Business logic (Module 2+)
    │   ├── repository/       # Spring Data JPA
    │   ├── domain/
    │   │   ├── entity/       # JPA entities
    │   │   └── enums/        # Shared enums
    │   ├── dto/              # Request/response DTOs (Module 2+)
    │   └── exception/        # Global error handling
    └── resources/
        ├── application.yml
        └── db/migration/     # Flyway SQL scripts
```

## Prerequisites

1. **Java 17+**
2. **Maven 3.9+** (or use IntelliJ/Eclipse embedded Maven)
3. **PostgreSQL 14+**

## Installation

### 1. Create PostgreSQL database

```sql
CREATE DATABASE numberbuddies_phase2;
```

### 2. Configure environment variables

Copy `.env.example` values into your shell or IDE run configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/numberbuddies_phase2` |
| `DATABASE_USERNAME` | DB user | `postgres` |
| `DATABASE_PASSWORD` | DB password | `postgres` |
| `PORT` | Server port | `8080` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |
| `AI_ENABLED` | Enable LLM calls | `false` |
| `AI_API_KEY` | LLM API key | — |
| `AI_API_URL` | LLM endpoint | OpenAI-compatible URL |
| `AI_MODEL` | Model name | `gpt-4o-mini` |

### 3. Build and run

```bash
cd phase2-backend
mvn clean spring-boot:run
```

### 4. Verify health check

```bash
curl http://localhost:8080/api/v2/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "number-buddies-phase2",
  "phase": 2
}
```

## Deployment (Render / Railway)

1. Set build command: `mvn -DskipTests clean package`
2. Set start command: `java -jar target/phase2-backend-1.0.0-SNAPSHOT.jar`
3. Add PostgreSQL plugin and map `DATABASE_URL` (Render provides JDBC URL format)
4. Set `CORS_ORIGINS` to your Vercel frontend URL

## Relationship to Phase 1

| Phase 1 (unchanged) | Phase 2 (this service) |
|---------------------|--------------------------|
| Node.js + MongoDB | Spring Boot + PostgreSQL |
| Auth, scoring, CSV | History, AI, practice, dashboard |
| `frontend/src/api/client.js` | Future: `frontend/src/api/springClient.js` |

## Module Status

- **Module 1 (complete):** Project scaffold, entities, repositories, Flyway schema, health endpoint
- **Module 2 (complete):** Assessment history sync API, topic mapping, History page, frontend sync hook
- **Module 3 (complete):** AI analysis with LLM + rule-based fallback, insights page
- **Module 5 (complete):** Practice generator (rule-based + AI), submit grading, Practice page
- **Module 6 (next):** Parent dashboard

See root `PHASE2_IMPLEMENTATION_PLAN.md` for the full roadmap.
