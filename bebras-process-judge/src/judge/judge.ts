import type {
  AiUsageSummary,
  Attempt,
  CalibrationSummary,
  CtElement,
  CtProfileItem,
  Problem,
  ProblemResponse,
  ProcessStep,
  ProcessStepResponse,
  ResultProcessQuadrant,
  RevisionQuality,
  TutorMode,
} from '../types'
import { ctLabels } from '../utils/labels'
import { checkDrawnPath, isContiguous, smallestPeriod } from '../utils/grid'

export function judgeProcessStep(step: ProcessStep, selections: string[]): ProcessStepResponse {
  if (step.type === 'path_draw') return judgePathDraw(step, selections)
  if (step.type === 'state_trace') return judgeStateTrace(step, selections)
  if (step.type === 'pattern_mark') return judgePatternMark(step, selections)

  if (step.type === 'step_order') {
    const total = step.correct.length
    const earned = step.correct.reduce(
      (score, expectedId, index) => score + (selections[index] === expectedId ? 1 : 0),
      0,
    )
    return {
      stepId: step.id,
      selections,
      earned,
      total,
      exact: earned === total && selections.length === total,
    }
  }

  // multi_select, error_spot, network_select 등 집합 비교형
  const correctSet = new Set(step.correct)
  const selectionSet = new Set(selections)
  const correctSelections = selections.filter((id) => correctSet.has(id)).length
  const incorrectSelections = selections.filter((id) => !correctSet.has(id)).length
  const earned = Math.max(0, correctSelections - incorrectSelections)

  return {
    stepId: step.id,
    selections,
    earned,
    total: step.correct.length,
    exact:
      selectionSet.size === correctSet.size &&
      [...correctSet].every((id) => selectionSet.has(id)),
  }
}

/**
 * 경로 그리기는 정답 경로와의 일치가 아니라 경로의 성질을 봅니다.
 * 같은 길이의 다른 최단 경로도 정답으로 인정합니다.
 */
function judgePathDraw(step: ProcessStep, selections: string[]): ProcessStepResponse {
  const board = step.path
  if (!board) {
    return { stepId: step.id, selections, earned: 0, total: 0, exact: false }
  }

  const check = checkDrawnPath(board, selections)
  const criteria = [
    { label: '출발점에서 시작해 도착점에서 끝남', passed: check.startsAtStart && check.endsAtGoal },
    { label: '한 칸씩 이어진 경로임', passed: check.connected && check.noRevisit },
    { label: '막힌 칸을 지나지 않음', passed: check.avoidsBlocked },
    { label: '이동 횟수가 최소임', passed: check.isOptimal },
  ]
  const earned = criteria.filter((item) => item.passed).length

  return {
    stepId: step.id,
    selections,
    earned,
    total: criteria.length,
    exact: earned === criteria.length,
    criteria,
  }
}

/** 상태 추적은 단계마다 1점씩 줍니다. */
function judgeStateTrace(step: ProcessStep, selections: string[]): ProcessStepResponse {
  const stages = step.states?.stages ?? []
  const criteria = stages.map((stage, index) => ({
    label: stage.label,
    passed: selections[index] === stage.correctId,
  }))
  const earned = criteria.filter((item) => item.passed).length

  return {
    stepId: step.id,
    selections,
    earned,
    total: stages.length,
    exact: stages.length > 0 && earned === stages.length,
    criteria,
  }
}

/**
 * 패턴 표시는 위치가 아니라 '가장 작은 반복 단위를 잡았는가'를 봅니다.
 * 같은 주기의 다른 시작 위치도 정답으로 인정합니다.
 */
function judgePatternMark(step: ProcessStep, selections: string[]): ProcessStepResponse {
  const tokens = step.pattern?.tokens ?? []
  const indexes = selections
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < tokens.length)
    .sort((a, b) => a - b)

  const period = step.pattern?.unitLength ?? smallestPeriod(tokens)
  const contiguous = isContiguous(indexes)
  const marked = indexes.map((index) => tokens[index])
  const tiles =
    marked.length > 0 && tokens.every((token, index) => token === marked[index % marked.length])

  const criteria = [
    { label: '이어진 한 덩어리를 표시함', passed: contiguous },
    { label: '표시한 단위가 전체 무늬를 채움', passed: contiguous && tiles },
    { label: '가장 작은 반복 단위임', passed: contiguous && tiles && marked.length === period },
  ]
  const earned = criteria.filter((item) => item.passed).length

  return {
    stepId: step.id,
    selections,
    earned,
    total: criteria.length,
    exact: earned === criteria.length,
    criteria,
  }
}

export function judgeProblemProcess(problem: Problem, answers: Record<string, string[]>) {
  const processResponses = problem.processSteps.map((step) =>
    judgeProcessStep(step, answers[step.id] ?? []),
  )
  return {
    processResponses,
    earned: processResponses.reduce((sum, response) => sum + response.earned, 0),
    total: processResponses.reduce((sum, response) => sum + response.total, 0),
    exact: processResponses.every((response) => response.exact),
  }
}

export function responseScore(response: ProblemResponse) {
  return {
    independent: response.initialCorrect ? 1 : 0,
    process: response.processCorrectCount,
    processTotal: response.processTotal,
    final: response.finalCorrect ? 1 : 0,
    transfer: response.transferCorrect ? 2 : 0,
    total:
      (response.initialCorrect ? 1 : 0) +
      response.processCorrectCount +
      (response.finalCorrect ? 1 : 0) +
      (response.transferCorrect ? 2 : 0),
    possible: 1 + response.processTotal + 1 + 2,
  }
}

/**
 * 컴퓨팅 사고 6요소 프로파일입니다.
 * AI 활용 기록은 여기에 넣지 않습니다.
 */
export function buildCtProfile(attempt: Attempt, problems: Problem[]): CtProfileItem[] {
  const base: Record<CtElement, { earned: number; total: number }> = {
    abstraction: { earned: 0, total: 0 },
    decomposition: { earned: 0, total: 0 },
    algorithm: { earned: 0, total: 0 },
    evaluation: { earned: 0, total: 0 },
    pattern: { earned: 0, total: 0 },
    generalization: { earned: 0, total: 0 },
  }

  attempt.responses.forEach((response) => {
    const problem = problems.find((item) => item.id === response.problemId)
    if (!problem) return

    response.processResponses.forEach((stepResponse) => {
      const step = problem.processSteps.find((item) => item.id === stepResponse.stepId)
      if (!step) return
      base[step.ctElement].earned += stepResponse.earned
      base[step.ctElement].total += stepResponse.total
    })

    base.generalization.earned += response.transferCorrect ? 1 : 0
    base.generalization.total += 1
  })

  return (Object.keys(base) as CtElement[]).map((element) => {
    const value = base[element]
    return {
      element,
      label: ctLabels[element],
      earned: value.earned,
      total: value.total,
      percent: value.total === 0 ? 0 : Math.round((value.earned / value.total) * 100),
    }
  })
}

export function summarizeAttempt(attempt: Attempt) {
  const count = attempt.responses.length || 1
  const initialCorrect = attempt.responses.filter((item) => item.initialCorrect).length
  const finalCorrect = attempt.responses.filter((item) => item.finalCorrect).length
  const transferCorrect = attempt.responses.filter((item) => item.transferCorrect).length
  const processEarned = attempt.responses.reduce((sum, item) => sum + item.processCorrectCount, 0)
  const processTotal = attempt.responses.reduce((sum, item) => sum + item.processTotal, 0)

  return {
    initialPercent: Math.round((initialCorrect / count) * 100),
    finalPercent: Math.round((finalCorrect / count) * 100),
    transferPercent: Math.round((transferCorrect / count) * 100),
    processPercent: processTotal === 0 ? 0 : Math.round((processEarned / processTotal) * 100),
  }
}

/**
 * 확신도 보정입니다. 확실하다고 했는데 틀리면 과신,
 * 모르겠다고 했는데 맞으면 과소 확신으로 봅니다.
 */
export function buildCalibration(attempt: Attempt): CalibrationSummary {
  let overconfident = 0
  let underconfident = 0
  let aligned = 0

  attempt.responses.forEach((response) => {
    if (response.confidence === 'medium') return
    const confident = response.confidence === 'high'
    if (confident && !response.initialCorrect) overconfident += 1
    else if (!confident && response.initialCorrect) underconfident += 1
    else aligned += 1
  })

  const measured = overconfident + underconfident + aligned
  return {
    measured,
    aligned,
    overconfident,
    underconfident,
    percent: measured === 0 ? 0 : Math.round((aligned / measured) * 100),
  }
}

/** 과정 확인 뒤 답이 좋아졌는지 나빠졌는지 봅니다. */
export function buildRevisionQuality(attempt: Attempt): RevisionQuality {
  const quality: RevisionQuality = { improved: 0, damaged: 0, keptCorrect: 0, keptWrong: 0 }
  attempt.responses.forEach((response) => {
    const changed = response.initialAnswer !== response.finalAnswer
    if (changed && !response.initialCorrect && response.finalCorrect) quality.improved += 1
    else if (changed && response.initialCorrect && !response.finalCorrect) quality.damaged += 1
    else if (response.finalCorrect) quality.keptCorrect += 1
    else quality.keptWrong += 1
  })
  return quality
}

/**
 * 결과와 과정을 교차합니다.
 * 정답이지만 과정 증거가 약하면 추측 가능성을 표시합니다.
 */
export function buildQuadrant(attempt: Attempt, threshold = 0.6): ResultProcessQuadrant {
  const quadrant: ResultProcessQuadrant = {
    strategic: 0,
    likelyGuess: 0,
    slipped: 0,
    developing: 0,
  }

  attempt.responses.forEach((response) => {
    const processRatio =
      response.processTotal === 0 ? 0 : response.processCorrectCount / response.processTotal
    const strongProcess = processRatio >= threshold
    if (response.finalCorrect && strongProcess) quadrant.strategic += 1
    else if (response.finalCorrect && !strongProcess) quadrant.likelyGuess += 1
    else if (!response.finalCorrect && strongProcess) quadrant.slipped += 1
    else quadrant.developing += 1
  })

  return quadrant
}

/**
 * AI 활용 역량 요약입니다.
 * 컴퓨팅 사고 점수와 분리해서 보고, 점수 계산에는 쓰지 않습니다.
 */
export function buildAiUsage(attempt: Attempt): AiUsageSummary {
  const uses = attempt.tutorUses ?? []
  const byMode: Record<TutorMode, number> = { hint: 0, counterexample: 0, debug: 0 }
  uses.forEach((use) => {
    byMode[use.mode] = (byMode[use.mode] ?? 0) + 1
  })

  const problemsWithHelp = new Set(uses.map((use) => use.problemId))
  const revisedAfterHelp = attempt.responses.filter((response) => {
    const helped = problemsWithHelp.has(response.problemId)
    return helped && response.initialAnswer !== response.finalAnswer
  }).length

  return {
    total: uses.length,
    byMode,
    problemsWithHelp: problemsWithHelp.size,
    maxDepth: uses.reduce((max, use) => Math.max(max, use.depth), 0),
    revisedAfterHelp,
    independentProblems: attempt.responses.filter(
      (response) => !problemsWithHelp.has(response.problemId),
    ).length,
  }
}
