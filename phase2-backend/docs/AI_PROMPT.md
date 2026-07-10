# AI Prompt Reference — Module 3

The AI analysis service sends structured JSON to an OpenAI-compatible LLM and expects **JSON-only** responses.

## Configuration

```env
AI_ENABLED=true
AI_API_KEY=sk-...
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=30
```

When `AI_ENABLED=false` or the LLM fails, the system uses **rule-based fallback** (`AiAnalysisFallbackService`) with topic-specific suggestions.

## System Prompt (summary)

- Never diagnose dyscalculia or any medical condition
- Return ONLY valid JSON (no markdown)
- Suggestions must target specific weak areas from the payload
- `riskLevel`: LOW | MODERATE | HIGH (educational support level)

## User Prompt Payload

Built from `AssessmentAnalysisContext`:

| Field | Source |
|-------|--------|
| Age, Grade | User profile |
| Score, Accuracy, Time, Difficulty | Assessment record |
| Mistakes by topic | Aggregated from question results |
| Question history | Per-question text, answers, correctness, response time |

## Expected LLM JSON Schema

```json
{
  "riskLevel": "LOW|MODERATE|HIGH",
  "weakAreas": ["ADDITION", "..."],
  "strengths": ["COMPARISON", "..."],
  "summary": "string",
  "parentSuggestions": ["string"],
  "teacherSuggestions": ["string"],
  "practicePlan": ["string"]
}
```

## Fallback Behavior

Triggered when:
- AI disabled
- API key missing
- HTTP timeout or error
- Invalid JSON response

Fallback uses `WeakAreaDetectionService` (accuracy &lt; 60% per topic) and topic-specific suggestion templates.

## Disclaimer

Every report includes:

> This is an educational screening tool, not a medical diagnosis of dyscalculia.

Stored in `ai_reports.disclaimer` and displayed on the frontend.
