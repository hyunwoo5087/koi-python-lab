import type { JudgeEvent } from '../types'

export function createJudgeEvent(params: {
  sessionId: string
  studentKey: string
  problemId: string
  eventType: JudgeEvent['eventType']
  sequence: number
  elapsedMs: number
  payload?: Record<string, unknown>
}): JudgeEvent {
  return {
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    studentKey: params.studentKey,
    problemId: params.problemId,
    eventType: params.eventType,
    sequence: params.sequence,
    elapsedMs: params.elapsedMs,
    createdAt: new Date().toISOString(),
    payload: params.payload ?? {},
  }
}
