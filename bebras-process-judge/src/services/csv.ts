import type { Attempt, Problem } from '../types'
import {
  buildAiUsage,
  buildCalibration,
  buildCtProfile,
  buildQuadrant,
  buildRevisionQuality,
  summarizeAttempt,
} from '../judge/judge'
import { confidenceLabels, processTypeLabels, revisionReasonLabels } from '../utils/labels'

function escapeCsv(value: string | number) {
  const text = String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function download(rows: Array<Array<string | number>>, fileName: string) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * 학생별 요약입니다.
 * AI 활용 항목은 컴퓨팅 사고 점수와 분리해서 별도 열에 담습니다.
 */
export function downloadAttemptsCsv(attempts: Attempt[], problems: Problem[] = []) {
  const header = [
    '학생',
    '학급코드',
    '시작시각',
    '완료시각',
    '독립정답률',
    '과정수행률',
    '최종정답률',
    '전이정답률',
    '추상화',
    '문제분해',
    '알고리즘적사고',
    '평가디버깅',
    '패턴인식',
    '일반화전이',
    '확신도일치율',
    '과신문항수',
    '과소확신문항수',
    '오답에서정답',
    '정답에서오답',
    '전략적해결',
    '추측의심',
    'AI도움총사용',
    'AI힌트',
    'AI반례',
    'AI디버깅',
    'AI최대힌트단계',
    'AI없이푼문제수',
  ]

  const rows = attempts.map((attempt) => {
    const summary = summarizeAttempt(attempt)
    const profile = buildCtProfile(attempt, problems)
    const byElement = new Map(profile.map((item) => [item.element, item]))
    const percentOf = (element: string) => {
      const item = byElement.get(element as never)
      return item && item.total > 0 ? item.percent : ''
    }
    const calibration = buildCalibration(attempt)
    const revision = buildRevisionQuality(attempt)
    const quadrant = buildQuadrant(attempt)
    const ai = buildAiUsage(attempt)

    return [
      attempt.nickname,
      attempt.classCode,
      attempt.startedAt,
      attempt.completedAt,
      summary.initialPercent,
      summary.processPercent,
      summary.finalPercent,
      summary.transferPercent,
      percentOf('abstraction'),
      percentOf('decomposition'),
      percentOf('algorithm'),
      percentOf('evaluation'),
      percentOf('pattern'),
      percentOf('generalization'),
      calibration.measured === 0 ? '' : calibration.percent,
      calibration.overconfident,
      calibration.underconfident,
      revision.improved,
      revision.damaged,
      quadrant.strategic,
      quadrant.likelyGuess,
      ai.total,
      ai.byMode.hint,
      ai.byMode.counterexample,
      ai.byMode.debug,
      ai.maxDepth,
      ai.independentProblems,
    ]
  })

  download([header, ...rows], `비버_과정평가_학생별_${new Date().toISOString().slice(0, 10)}.csv`)
}

/** 문제별 상세입니다. 과정 증거의 항목별 판정까지 담습니다. */
export function downloadResponsesCsv(attempts: Attempt[], problems: Problem[]) {
  const header = [
    '학생',
    '학급코드',
    '문제',
    '분류',
    'DOK보조태그',
    '첫답',
    '확신도',
    '첫답정답여부',
    '최종답',
    '최종정답여부',
    '수정이유',
    '과정획득',
    '과정만점',
    '전이답',
    '전이정답여부',
    '소요초',
    'AI도움사용',
    '과정증거상세',
  ]

  const rows: Array<Array<string | number>> = []
  attempts.forEach((attempt) => {
    attempt.responses.forEach((response) => {
      const problem = problems.find((item) => item.id === response.problemId)
      const detail = response.processResponses
        .map((stepResponse) => {
          const step = problem?.processSteps.find((item) => item.id === stepResponse.stepId)
          const typeLabel = step ? processTypeLabels[step.type] : stepResponse.stepId
          const criteria = stepResponse.criteria
            ? ` [${stepResponse.criteria
                .map((item) => `${item.passed ? 'O' : 'X'}${item.label}`)
                .join('; ')}]`
            : ''
          return `${typeLabel} ${stepResponse.earned}/${stepResponse.total}${criteria} → ${stepResponse.selections.join(' | ')}`
        })
        .join(' ⁄ ')

      rows.push([
        attempt.nickname,
        attempt.classCode,
        problem?.title ?? response.problemId,
        problem?.category ?? '',
        problem?.dokLevel ?? '',
        response.initialAnswer,
        confidenceLabels[response.confidence] ?? '',
        response.initialCorrect ? 'O' : 'X',
        response.finalAnswer,
        response.finalCorrect ? 'O' : 'X',
        revisionReasonLabels[response.revisionReason] ?? '',
        response.processCorrectCount,
        response.processTotal,
        response.transferAnswer,
        response.transferCorrect ? 'O' : 'X',
        Math.round(response.elapsedMs / 1000),
        response.tutorUseCount ?? 0,
        detail,
      ])
    })
  })

  download([header, ...rows], `비버_과정평가_문제별_${new Date().toISOString().slice(0, 10)}.csv`)
}
