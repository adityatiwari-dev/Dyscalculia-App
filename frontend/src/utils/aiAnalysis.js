import springClient from '../api/springClient'
import { getUser } from '../auth'

/**
 * Requests AI educational analysis for a synced assessment.
 * Non-blocking: failures are logged and do not interrupt the user flow.
 */
export async function requestAiAnalysis(assessmentId) {
  try {
    const user = getUser()
    const externalUserId = user?._id || user?.id
    if (!externalUserId || !assessmentId) return null

    const res = await springClient.post('/api/v2/ai/analyze', {
      assessmentId,
      externalUserId,
    })
    return res.data
  } catch (err) {
    console.warn(
      '[Phase2] AI analysis skipped:',
      err?.response?.data?.message || err?.message || err
    )
    return null
  }
}
