import type { Attempt } from '../types'

const ATTEMPTS_KEY = 'bebras-process-judge:attempts:v2'
const LEGACY_KEY = 'bebras-process-judge:attempts'

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Attempt[]
    return Array.isArray(parsed) ? parsed.filter(isCurrentAttempt) : []
  } catch {
    return []
  }
}

export function saveAttempt(attempt: Attempt) {
  const attempts = loadAttempts()
  const index = attempts.findIndex((item) => item.id === attempt.id)
  if (index >= 0) attempts[index] = attempt
  else attempts.unshift(attempt)
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(LEGACY_KEY)
}

function isCurrentAttempt(value: Attempt) {
  return Boolean(
    value &&
      Array.isArray(value.responses) &&
      value.responses.every((response) => Array.isArray(response.processResponses)),
  )
}
