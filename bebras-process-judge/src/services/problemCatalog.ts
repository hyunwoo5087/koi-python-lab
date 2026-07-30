import type { Choice, Problem, ProblemCatalog, ProcessStep, ProcessType } from '../types'
import { cellKey, findShortestPath, shortestMoves, smallestPeriod } from '../utils/grid'

const CUSTOM_KEY = 'bebras-process-judge:custom-problems:v3'
const DISABLED_BUILT_INS_KEY = 'bebras-process-judge:disabled-built-ins:v3'

/** 교사가 제작기에서 고를 수 있는 과정 증거 유형입니다. */
export type AuthoringProcessType =
  | 'multi_select'
  | 'step_order'
  | 'error_spot'
  | 'path_draw'
  | 'state_trace'
  | 'pattern_mark'
  | 'network_select'

export const authoringProcessTypes: AuthoringProcessType[] = [
  'multi_select',
  'step_order',
  'error_spot',
  'path_draw',
  'state_trace',
  'pattern_mark',
  'network_select',
]

export function loadCustomProblems(): Problem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Problem[]
    return Array.isArray(parsed) ? parsed.filter(isUsableProblem) : []
  } catch {
    return []
  }
}

export function loadDisabledBuiltInIds(): string[] {
  try {
    const raw = localStorage.getItem(DISABLED_BUILT_INS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function getProblemCatalog(builtInProblems: Problem[]): ProblemCatalog {
  const customProblems = loadCustomProblems()
  const disabledBuiltInIds = loadDisabledBuiltInIds()
  const disabled = new Set(disabledBuiltInIds)

  const builtIns = builtInProblems.map((problem) => ({
    ...problem,
    origin: 'built_in' as const,
    isActive: !disabled.has(problem.id),
  }))

  const customs = customProblems.map((problem) => ({
    ...problem,
    origin: 'custom' as const,
    isActive: problem.isActive !== false,
  }))

  const allProblems = [...builtIns, ...customs]
  return {
    allProblems,
    activeProblems: allProblems.filter((problem) => problem.isActive !== false),
    customProblems: customs,
    disabledBuiltInIds,
  }
}

export function saveCustomProblem(problem: Problem) {
  const customs = loadCustomProblems()
  const nextProblem: Problem = {
    ...problem,
    origin: 'custom',
    isActive: problem.isActive !== false,
    updatedAt: new Date().toISOString(),
    createdAt: problem.createdAt ?? new Date().toISOString(),
  }
  const index = customs.findIndex((item) => item.id === nextProblem.id)
  if (index >= 0) customs[index] = nextProblem
  else customs.unshift(nextProblem)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs))
}

/** 일괄 등록에서 여러 문제를 한 번에 저장합니다. */
export function saveCustomProblems(problems: Problem[]) {
  const customs = loadCustomProblems()
  const now = new Date().toISOString()
  problems.forEach((problem) => {
    const nextProblem: Problem = {
      ...problem,
      origin: 'custom',
      isActive: problem.isActive !== false,
      updatedAt: now,
      createdAt: problem.createdAt ?? now,
    }
    const index = customs.findIndex((item) => item.id === nextProblem.id)
    if (index >= 0) customs[index] = nextProblem
    else customs.unshift(nextProblem)
  })
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs))
}

export function deleteCustomProblem(problemId: string) {
  const next = loadCustomProblems().filter((problem) => problem.id !== problemId)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
}

export function setCustomProblemActive(problemId: string, isActive: boolean) {
  const customs = loadCustomProblems().map((problem) =>
    problem.id === problemId
      ? { ...problem, isActive, updatedAt: new Date().toISOString() }
      : problem,
  )
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs))
}

export function setBuiltInProblemActive(problemId: string, isActive: boolean) {
  const disabled = new Set(loadDisabledBuiltInIds())
  if (isActive) disabled.delete(problemId)
  else disabled.add(problemId)
  localStorage.setItem(DISABLED_BUILT_INS_KEY, JSON.stringify([...disabled]))
}

export function duplicateProblem(problem: Problem): Problem {
  const timestamp = Date.now()
  const baseId = slugify(problem.title) || 'problem'
  return {
    ...structuredClone(problem),
    id: `custom-${baseId}-${timestamp}`,
    version: 1,
    title: `${problem.title} 복사본`,
    origin: 'custom',
    isActive: false,
    createdAt: undefined,
    updatedAt: undefined,
    processSteps: problem.processSteps.map((step, index) => ({
      ...structuredClone(step),
      id: `process-${timestamp}-${index + 1}`,
    })),
  }
}

export function createBlankProblem(): Problem {
  const timestamp = Date.now()
  return {
    id: `custom-problem-${timestamp}`,
    version: 1,
    title: '새 비버형 문제',
    category: '조건·규칙',
    ctElements: ['abstraction'],
    stem: '학생에게 제시할 문제 상황과 해결 과제를 입력하세요.',
    rules: ['필요한 규칙이나 조건을 입력하세요.'],
    visual: { type: 'none' },
    choices: createDefaultChoices(),
    correctAnswer: 'A',
    explanation: '정답의 이유와 학생 피드백에 사용할 설명을 입력하세요.',
    processSteps: [createProcessStep('multi_select', 1)],
    transfer: {
      stem: '같은 해결 원리를 새로운 상황에 적용하는 전이 문제를 입력하세요.',
      choices: createDefaultChoices(),
      correctAnswer: 'A',
      explanation: '전이 문제 정답 설명을 입력하세요.',
    },
    hints: [],
    choiceProbes: [],
    origin: 'custom',
    isActive: false,
    createdAt: undefined,
    updatedAt: undefined,
  }
}

export function createProcessStep(type: AuthoringProcessType, order: number): ProcessStep {
  const timestamp = Date.now()
  const id = `process-${timestamp}-${order}`

  if (type === 'step_order') {
    const items = [
      { id: `step-${timestamp}-1`, text: '첫 번째 단계' },
      { id: `step-${timestamp}-2`, text: '두 번째 단계' },
      { id: `step-${timestamp}-3`, text: '세 번째 단계' },
    ]
    return {
      id,
      type,
      question: '해결 순서가 되도록 항목을 배열하세요.',
      instruction: '',
      ctElement: 'algorithm',
      items,
      correct: items.map((item) => item.id),
    }
  }

  if (type === 'path_draw') {
    const path = {
      width: 6,
      height: 5,
      start: cellKey(1, 1),
      goal: cellKey(6, 5),
      blocked: [cellKey(3, 1), cellKey(3, 2), cellKey(3, 3), cellKey(5, 5)],
    }
    return {
      id,
      type,
      question: '출발점에서 도착점까지 가장 짧은 경로를 그려 보세요.',
      instruction: '칸을 순서대로 눌러 경로를 만듭니다. 마지막 칸을 다시 누르면 지워집니다.',
      ctElement: 'algorithm',
      items: [],
      correct: findShortestPath(path),
      path: { ...path, optimalMoves: shortestMoves(path) ?? undefined },
    }
  }

  if (type === 'state_trace') {
    const stages = [
      {
        id: `stage-${timestamp}-1`,
        label: '첫 번째 명령을 실행한 직후',
        options: [
          { id: `state-${timestamp}-1a`, text: '상태 설명 1' },
          { id: `state-${timestamp}-1b`, text: '상태 설명 2' },
          { id: `state-${timestamp}-1c`, text: '상태 설명 3' },
        ],
        correctId: `state-${timestamp}-1a`,
      },
      {
        id: `stage-${timestamp}-2`,
        label: '두 번째 명령을 실행한 직후',
        options: [
          { id: `state-${timestamp}-2a`, text: '상태 설명 1' },
          { id: `state-${timestamp}-2b`, text: '상태 설명 2' },
          { id: `state-${timestamp}-2c`, text: '상태 설명 3' },
        ],
        correctId: `state-${timestamp}-2a`,
      },
    ]
    return {
      id,
      type,
      question: '명령을 하나씩 실행할 때마다 중간 상태를 골라 보세요.',
      instruction: '',
      ctElement: 'algorithm',
      items: [],
      correct: stages.map((stage) => stage.correctId),
      states: { stages },
    }
  }

  if (type === 'pattern_mark') {
    const tokens = ['●', '▲', '▲', '●', '▲', '▲', '●', '▲', '▲']
    const unitLength = smallestPeriod(tokens)
    return {
      id,
      type,
      question: '반복되는 가장 작은 단위를 표시하세요.',
      instruction: '이어진 칸을 눌러 반복 단위를 감싸 보세요.',
      ctElement: 'pattern',
      items: [],
      correct: Array.from({ length: unitLength }, (_, index) => String(index)),
      pattern: { tokens, unitLength },
    }
  }

  if (type === 'network_select') {
    const nodes = [
      { id: 'A', x: 15, y: 25 },
      { id: 'B', x: 15, y: 75 },
      { id: 'C', x: 40, y: 50 },
      { id: 'D', x: 70, y: 50 },
      { id: 'E', x: 90, y: 25 },
      { id: 'F', x: 90, y: 75 },
    ]
    const edges = [
      { id: 'A-B', from: 'A', to: 'B' },
      { id: 'B-C', from: 'B', to: 'C' },
      { id: 'C-A', from: 'C', to: 'A' },
      { id: 'C-D', from: 'C', to: 'D' },
      { id: 'D-E', from: 'D', to: 'E' },
      { id: 'E-F', from: 'E', to: 'F' },
      { id: 'F-D', from: 'F', to: 'D' },
    ]
    return {
      id,
      type,
      question: '끊기면 통신망이 둘로 나뉘는 연결을 고르세요.',
      instruction: '선을 눌러 표시하거나 다시 눌러 해제합니다.',
      ctElement: 'decomposition',
      items: [],
      correct: ['C-D'],
      network: { nodes, edges, target: 'edge' },
    }
  }

  // multi_select, error_spot
  const itemIds = [
    `item-${timestamp}-1`,
    `item-${timestamp}-2`,
    `item-${timestamp}-3`,
    `item-${timestamp}-4`,
  ]
  return {
    id,
    type,
    question:
      type === 'error_spot'
        ? '잘못된 설명을 바로잡은 항목을 고르세요.'
        : '문제 해결에 필요한 정보를 모두 고르세요.',
    instruction: '',
    ctElement: type === 'error_spot' ? 'evaluation' : 'abstraction',
    maxSelections: type === 'error_spot' ? 1 : undefined,
    items: itemIds.map((itemId, index) => ({ id: itemId, text: `선택 항목 ${index + 1}` })),
    correct: [itemIds[0]],
  }
}

/** 제작기에서 지원하는 유형으로 좁힙니다. 예전 선택형은 가까운 유형으로 대응시킵니다. */
export function toAuthoringType(type: ProcessType): AuthoringProcessType {
  if (authoringProcessTypes.includes(type as AuthoringProcessType)) {
    return type as AuthoringProcessType
  }
  if (type === 'state_select') return 'state_trace'
  if (type === 'pattern_select') return 'pattern_mark'
  if (type === 'edge_select') return 'network_select'
  return 'multi_select'
}

function createDefaultChoices(): Choice[] {
  return ['A', 'B', 'C', 'D'].map((id) => ({ id, text: `선택지 ${id}` }))
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

function isUsableProblem(problem: Problem) {
  return Boolean(
    problem &&
      typeof problem.id === 'string' &&
      typeof problem.title === 'string' &&
      Array.isArray(problem.choices) &&
      Array.isArray(problem.processSteps) &&
      problem.transfer,
  )
}
