import springClient from '../api/springClient'
import { getUser } from '../auth'
import { requestAiAnalysis } from './aiAnalysis'

/**
 * Syncs a completed Phase 1 assessment to the Phase 2 PostgreSQL backend.
 * Non-blocking: failures are logged and do not interrupt the existing flow.
 */
export async function syncAssessmentToPhase2({
  assessmentType,
  legacyAssessmentId,
  questions,
  answers,
  subtype = null,
}) {
  try {
    const user = getUser()
    const externalUserId = user?._id || user?.id
    if (!externalUserId) return null

    const questionItems = questions.map((q, idx) => {
      const a = answers[idx] || {}
      const selected = a.selected ?? a.selectedAnswer ?? a.selectedOption ?? null
      const isCorrect =
        a.isCorrect ?? (selected !== null && String(selected) === String(q.correctAnswer))

      return {
        sequenceNumber: idx + 1,
        questionType: q.questionType || 'ADAPTIVE',
        questionText: q.questionText || '',
        correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : null,
        selectedAnswer: selected != null ? String(selected) : null,
        isCorrect: Boolean(isCorrect),
        responseTimeMs: a.responseTimeMs ?? a.responseTime ?? 0,
        difficulty: q.difficulty ?? null,
        subtype: q.subtype ?? subtype ?? null,
      }
    })

    const correctCount = questionItems.filter((q) => q.isCorrect).length
    const total = questionItems.length || 1
    const totalScore = Math.round((correctCount / total) * 100 * 100) / 100
    const timeTakenMs = questionItems.reduce(
      (sum, q) => sum + (q.responseTimeMs || 0),
      0
    )
    const difficulties = questionItems
      .map((q) => q.difficulty)
      .filter((d) => d != null)
    const avgDifficulty =
      difficulties.length > 0
        ? Math.round(
            (difficulties.reduce((a, b) => a + b, 0) / difficulties.length) * 10
          ) / 10
        : null

    const res = await springClient.post('/api/v2/assessments/sync', {
      externalUserId: externalUserId,
      userProfile: {
        email: user.email,
        name: user.name,
        age: user.age ?? null,
        grade: user.grade ?? null,
        role: user.role ?? 'student',
      },
      legacyAssessmentId,
      assessmentType,
      totalScore,
      accuracy: totalScore,
      timeTakenMs,
      avgDifficulty,
      completedAt: new Date().toISOString(),
      questions: questionItems,
    })

    // Phase 2: trigger AI analysis after successful sync (non-blocking)
    if (res.data?.id) {
      await requestAiAnalysis(res.data.id)
    }

    return res.data
  } catch (err) {
    console.warn(
      '[Phase2] Assessment sync skipped:',
      err?.response?.data?.message || err?.message || err
    )
    return null
  }
}
