/**
 * Performance instrumentation for Assessment Flow
 * Tracks question transition times, cache hit rates, API latency, and autosave performance.
 */

class PerformanceMetricsLogger {
  constructor() {
    this.reset()
  }

  reset() {
    this.transitions = []
    this.cacheHits = 0
    this.cacheMisses = 0
    this.apiLatencies = []
    this.autosaveRecords = []
    this.sessionStartTime = Date.now()
  }

  logTransition(transitionTimeMs, wasCacheHit, difficulty) {
    this.transitions.push({
      timeMs: transitionTimeMs,
      cacheHit: wasCacheHit,
      difficulty,
      timestamp: Date.now()
    })

    if (wasCacheHit) {
      this.cacheHits++
    } else {
      this.cacheMisses++
    }

    if (import.meta.env?.MODE !== 'production' || window.__ASSESSMENT_DEBUG__) {
      console.info(
        `[Assessment Perf] Next Question Transition: ${transitionTimeMs.toFixed(2)}ms | ` +
        `Cache Hit: ${wasCacheHit ? 'YES' : 'NO (Fallback/API)'} | ` +
        `Difficulty: ${difficulty}`
      )
    }
  }

  logApiFetch(apiName, durationMs, success = true) {
    this.apiLatencies.push({
      apiName,
      durationMs,
      success,
      timestamp: Date.now()
    })

    if (import.meta.env?.MODE !== 'production' || window.__ASSESSMENT_DEBUG__) {
      console.info(
        `[Assessment Perf] API Fetch (${apiName}): ${durationMs.toFixed(2)}ms | ` +
        `Status: ${success ? 'SUCCESS' : 'FAILED'}`
      )
    }
  }

  logAutosave(durationMs, status) {
    this.autosaveRecords.push({
      durationMs,
      status,
      timestamp: Date.now()
    })

    if (import.meta.env?.MODE !== 'production' || window.__ASSESSMENT_DEBUG__) {
      console.info(
        `[Assessment Perf] Autosave (${status}): ${durationMs.toFixed(2)}ms`
      )
    }
  }

  getSummary() {
    const totalTransitions = this.transitions.length
    const avgTransitionTime = totalTransitions > 0
      ? this.transitions.reduce((sum, t) => sum + t.timeMs, 0) / totalTransitions
      : 0
    const maxTransitionTime = totalTransitions > 0
      ? Math.max(...this.transitions.map(t => t.timeMs))
      : 0
    const hitRate = totalTransitions > 0
      ? ((this.cacheHits / totalTransitions) * 100).toFixed(1)
      : '0.0'

    const totalApiCalls = this.apiLatencies.length
    const avgApiLatency = totalApiCalls > 0
      ? this.apiLatencies.reduce((sum, a) => sum + a.durationMs, 0) / totalApiCalls
      : 0

    return {
      totalTransitions,
      avgTransitionTimeMs: Number(avgTransitionTime.toFixed(2)),
      maxTransitionTimeMs: Number(maxTransitionTime.toFixed(2)),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRatePercent: Number(hitRate),
      totalApiFetches: totalApiCalls,
      avgApiLatencyMs: Number(avgApiLatency.toFixed(2)),
      totalAutosaves: this.autosaveRecords.length
    }
  }

  printReport() {
    const summary = this.getSummary()
    console.group('📊 Assessment Flow Performance Summary')
    console.table({
      'Avg Transition Time (ms)': summary.avgTransitionTimeMs,
      'Max Transition Time (ms)': summary.maxTransitionTimeMs,
      'Cache Hit Rate (%)': `${summary.cacheHitRatePercent}%`,
      'Total Cache Hits': summary.cacheHits,
      'Total Cache Misses': summary.cacheMisses,
      'Background API Fetches': summary.totalApiFetches,
      'Avg API Latency (ms)': summary.avgApiLatencyMs,
      'Total Autosaves Executed': summary.totalAutosaves
    })
    console.groupEnd()
    return summary
  }
}

export const perfLogger = new PerformanceMetricsLogger()
