import type { CtElement, Problem, ProcessStep } from '../types'
import { categoryProcessFit, ctLabels, processTypeLabels } from '../utils/labels'
import { shortestMoves, smallestPeriod } from '../utils/grid'
import { leaksAnswer } from './tutor'

export type ValiditySeverity = 'blocker' | 'warning' | 'info'

export interface ValidityFinding {
  severity: ValiditySeverity
  title: string
  detail: string
}

export interface ValidityReport {
  problemId: string
  title: string
  score: number
  findings: ValidityFinding[]
  coveredElements: CtElement[]
}

/**
 * 문제별 과정평가 타당성 검토입니다.
 * 모든 문제에 같은 서술형 질문을 붙이지 않았는지,
 * 과정 증거가 정답을 그대로 알려 주지 않는지 확인합니다.
 */
export function reviewProblem(problem: Problem): ValidityReport {
  const findings: ValidityFinding[] = []

  findings.push(...reviewProcessFit(problem))
  findings.push(...reviewCoverage(problem))
  findings.push(...reviewAnswerLeak(problem))
  findings.push(...reviewTransfer(problem))
  findings.push(...reviewBoards(problem))
  findings.push(...reviewAuxTags(problem))

  const blockers = findings.filter((item) => item.severity === 'blocker').length
  const warnings = findings.filter((item) => item.severity === 'warning').length
  const score = Math.max(0, 100 - blockers * 25 - warnings * 10)

  return {
    problemId: problem.id,
    title: problem.title,
    score,
    findings,
    coveredElements: [...new Set(problem.processSteps.map((step) => step.ctElement))],
  }
}

export function reviewCatalog(problems: Problem[]) {
  const reports = problems.map(reviewProblem)
  const elementCoverage: Record<CtElement, number> = {
    abstraction: 0,
    decomposition: 0,
    algorithm: 0,
    evaluation: 0,
    pattern: 0,
    generalization: 0,
  }

  problems.forEach((problem) => {
    problem.processSteps.forEach((step) => {
      elementCoverage[step.ctElement] += 1
    })
  })

  const typeUsage = new Map<string, number>()
  problems.forEach((problem) => {
    problem.processSteps.forEach((step) => {
      typeUsage.set(step.type, (typeUsage.get(step.type) ?? 0) + 1)
    })
  })

  return {
    reports,
    elementCoverage,
    typeUsage: [...typeUsage.entries()].map(([type, count]) => ({ type, count })),
    averageScore:
      reports.length === 0
        ? 0
        : Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length),
    blockerCount: reports.reduce(
      (sum, report) => sum + report.findings.filter((item) => item.severity === 'blocker').length,
      0,
    ),
  }
}

function reviewProcessFit(problem: Problem): ValidityFinding[] {
  const findings: ValidityFinding[] = []
  if (problem.processSteps.length === 0) {
    findings.push({
      severity: 'blocker',
      title: '과정 증거가 없습니다.',
      detail: '결과만 남는 문항입니다. 문제 유형에 맞는 과정 증거를 하나 이상 추가하세요.',
    })
    return findings
  }

  const fit = categoryProcessFit.find((item) =>
    item.keywords.some((keyword) => problem.category.includes(keyword)),
  )
  if (!fit) {
    findings.push({
      severity: 'info',
      title: '분류에서 권장 과정 유형을 찾지 못했습니다.',
      detail:
        '분류에 조건·규칙, 절차, 경로, 상태 변화, 패턴, 네트워크, 디버깅 중 하나가 들어가면 권장 유형을 확인할 수 있습니다.',
    })
    return findings
  }

  const usedTypes = problem.processSteps.map((step) => step.type)
  const matched = usedTypes.some((type) => fit.recommended.includes(type))
  if (!matched) {
    findings.push({
      severity: 'warning',
      title: `${fit.label}에 권장되는 과정 증거가 없습니다.`,
      detail: `권장 유형: ${fit.recommended.map((type) => processTypeLabels[type]).join(', ')}. 현재 유형: ${usedTypes
        .map((type) => processTypeLabels[type])
        .join(', ')}.`,
    })
  }

  const allSameSelect =
    problem.processSteps.length > 1 &&
    new Set(usedTypes).size === 1 &&
    usedTypes[0] === 'multi_select'
  if (allSameSelect) {
    findings.push({
      severity: 'info',
      title: '과정 증거가 모두 같은 유형입니다.',
      detail: '문제 유형에 맞는 다른 증거를 섞으면 사고 과정을 더 넓게 볼 수 있습니다.',
    })
  }

  return findings
}

function reviewCoverage(problem: Problem): ValidityFinding[] {
  const findings: ValidityFinding[] = []
  const declared = new Set(problem.ctElements)
  const measured = new Set(problem.processSteps.map((step) => step.ctElement))

  const declaredButUnmeasured = [...declared].filter(
    (element) => element !== 'generalization' && !measured.has(element),
  )
  if (declaredButUnmeasured.length > 0) {
    findings.push({
      severity: 'warning',
      title: '측정하겠다고 표시했지만 증거가 없는 요소가 있습니다.',
      detail: `${declaredButUnmeasured
        .map((element) => ctLabels[element])
        .join(', ')}에 연결된 과정 증거를 추가하거나, 문제의 요소 표시를 조정하세요.`,
    })
  }

  const measuredButUndeclared = [...measured].filter((element) => !declared.has(element))
  if (measuredButUndeclared.length > 0) {
    findings.push({
      severity: 'info',
      title: '표시하지 않은 요소를 실제로 측정하고 있습니다.',
      detail: `${measuredButUndeclared
        .map((element) => ctLabels[element])
        .join(', ')}를 문제의 측정 요소에 추가하면 대시보드 해석이 정확해집니다.`,
    })
  }

  return findings
}

function reviewAnswerLeak(problem: Problem): ValidityFinding[] {
  const findings: ValidityFinding[] = []
  const correctChoice = problem.choices.find((choice) => choice.id === problem.correctAnswer)

  problem.processSteps.forEach((step, index) => {
    if (step.type === 'step_order') {
      const presented = step.items.map((item) => item.id)
      if (presented.length > 1 && presented.every((id, position) => id === step.correct[position])) {
        findings.push({
          severity: 'blocker',
          title: `과정 ${index + 1}의 보기 순서가 정답 순서와 같습니다.`,
          detail:
            '학생이 아무것도 하지 않아도 정답이 됩니다. 항목을 섞어 저장하거나 학생 화면 섞기를 사용하세요.',
        })
      }
    }

    if (correctChoice && correctChoice.text.trim().length >= 6) {
      const leaked = step.items.some((item) =>
        item.text.replace(/\s+/g, '').includes(correctChoice.text.replace(/\s+/g, '')),
      )
      if (leaked) {
        findings.push({
          severity: 'warning',
          title: `과정 ${index + 1}의 보기가 정답 문장을 그대로 담고 있습니다.`,
          detail: '과정 증거가 정답을 알려 주면 최초 답과 최종 답을 분리한 의미가 사라집니다.',
        })
      }
    }
  })

  ;(problem.hints ?? []).forEach((hint, index) => {
    if (hint.trim() && leaksAnswer(hint, problem)) {
      findings.push({
        severity: 'blocker',
        title: `${index + 1}번째 힌트가 정답을 노출합니다.`,
        detail: '힌트는 생각할 방향만 주고 정답 문장이나 정답 문자를 담지 않아야 합니다.',
      })
    }
  })

  return findings
}

function reviewTransfer(problem: Problem): ValidityFinding[] {
  const findings: ValidityFinding[] = []
  if (!problem.transfer.stem.trim()) {
    findings.push({
      severity: 'blocker',
      title: '전이 문제가 비어 있습니다.',
      detail: '구조가 같고 표면 상황이 다른 문제를 넣어야 일반화를 확인할 수 있습니다.',
    })
    return findings
  }

  const sameSurface =
    problem.transfer.choices.length === problem.choices.length &&
    problem.transfer.choices.every(
      (choice, index) => choice.text.trim() === problem.choices[index]?.text.trim(),
    )
  if (sameSurface) {
    findings.push({
      severity: 'warning',
      title: '전이 문제의 선택지가 본문제와 똑같습니다.',
      detail: '표면 상황을 바꾸어야 원리 이해와 문항 암기를 구분할 수 있습니다.',
    })
  }

  if (problem.transfer.stem.trim() === problem.stem.trim()) {
    findings.push({
      severity: 'blocker',
      title: '전이 문제 설명이 본문제와 같습니다.',
      detail: '같은 문제를 다시 묻고 있어 전이를 측정하지 못합니다.',
    })
  }

  return findings
}

function reviewBoards(problem: Problem): ValidityFinding[] {
  const findings: ValidityFinding[] = []

  problem.processSteps.forEach((step, index) => {
    const prefix = `과정 ${index + 1}`

    if (step.type === 'path_draw') {
      if (!step.path) {
        findings.push({
          severity: 'blocker',
          title: `${prefix}에 격자 정보가 없습니다.`,
          detail: '경로 그리기 문항은 격자 크기, 출발점, 도착점, 막힌 칸이 필요합니다.',
        })
      } else {
        const moves = shortestMoves(step.path)
        if (moves === null) {
          findings.push({
            severity: 'blocker',
            title: `${prefix}의 도착점에 도달할 수 없습니다.`,
            detail: '막힌 칸이 길을 완전히 끊고 있습니다. 격자를 다시 확인하세요.',
          })
        } else if (step.path.optimalMoves !== undefined && step.path.optimalMoves !== moves) {
          findings.push({
            severity: 'warning',
            title: `${prefix}의 최소 이동 횟수가 실제와 다릅니다.`,
            detail: `입력값 ${step.path.optimalMoves}, 격자에서 계산한 값 ${moves}. 채점이 어긋납니다.`,
          })
        }
      }
    }

    if (step.type === 'state_trace') {
      const stages = step.states?.stages ?? []
      if (stages.length < 2) {
        findings.push({
          severity: 'warning',
          title: `${prefix}의 추적 단계가 너무 적습니다.`,
          detail: '중간 상태를 두 단계 이상 확인해야 상태 변화를 볼 수 있습니다.',
        })
      }
      stages.forEach((stage, stageIndex) => {
        if (!stage.options.some((option) => option.id === stage.correctId)) {
          findings.push({
            severity: 'blocker',
            title: `${prefix}의 ${stageIndex + 1}단계 정답이 보기 안에 없습니다.`,
            detail: '정답 상태를 보기 중 하나로 지정하세요.',
          })
        }
      })
    }

    if (step.type === 'pattern_mark') {
      const tokens = step.pattern?.tokens ?? []
      if (tokens.length < 4) {
        findings.push({
          severity: 'warning',
          title: `${prefix}의 무늬가 너무 짧습니다.`,
          detail: '반복 단위를 판단하려면 단위가 두 번 이상 나타나야 합니다.',
        })
      } else {
        const period = smallestPeriod(tokens)
        if (step.pattern && step.pattern.unitLength !== period) {
          findings.push({
            severity: 'warning',
            title: `${prefix}의 반복 단위 길이가 실제와 다릅니다.`,
            detail: `입력값 ${step.pattern.unitLength}, 무늬에서 계산한 가장 작은 주기 ${period}.`,
          })
        }
      }
    }

    if (step.type === 'network_select') {
      const network = step.network
      if (!network || network.nodes.length < 3) {
        findings.push({
          severity: 'blocker',
          title: `${prefix}의 네트워크가 너무 작습니다.`,
          detail: '노드를 세 개 이상 두고 정답 노드·간선을 지정하세요.',
        })
      } else {
        const validIds = new Set([
          ...network.nodes.map((node) => node.id),
          ...network.edges.map((edge) => edge.id),
        ])
        const unknown = step.correct.filter((id) => !validIds.has(id))
        if (unknown.length > 0) {
          findings.push({
            severity: 'blocker',
            title: `${prefix}의 정답이 네트워크에 없습니다.`,
            detail: `확인이 필요한 값: ${unknown.join(', ')}.`,
          })
        }
      }
    }
  })

  return findings
}

function reviewAuxTags(problem: Problem): ValidityFinding[] {
  if (problem.dokLevel === undefined) {
    return [
      {
        severity: 'info',
        title: 'DOK 보조 태그가 없습니다.',
        detail:
          'DOK는 평가 축이 아니지만, 문항의 인지적 요구 수준을 검토할 때 참고 태그로 남겨 둘 수 있습니다.',
      },
    ]
  }
  return []
}

/** 과정 증거 유형이 유효한 항목 수를 가지고 있는지 빠르게 확인합니다. */
export function stepItemCount(step: ProcessStep) {
  if (step.type === 'state_trace') return step.states?.stages.length ?? 0
  if (step.type === 'pattern_mark') return step.pattern?.tokens.length ?? 0
  if (step.type === 'network_select') {
    return (step.network?.nodes.length ?? 0) + (step.network?.edges.length ?? 0)
  }
  if (step.type === 'path_draw') return (step.path?.width ?? 0) * (step.path?.height ?? 0)
  return step.items.length
}
