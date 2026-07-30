/**
 * 평가 축은 컴퓨팅 사고 6요소입니다. DOK는 평가 축이 아니라
 * 문항의 인지적 요구 수준을 검토하는 보조 태그(Problem.dokLevel)로만 씁니다.
 */
export type CtElement =
  | 'abstraction'
  | 'decomposition'
  | 'algorithm'
  | 'evaluation'
  | 'pattern'
  | 'generalization'

export type Confidence = 'high' | 'medium' | 'low'

/** DOK는 점수에 반영하지 않는 보조 태그입니다. */
export type DokLevel = 1 | 2 | 3 | 4

export type ProcessType =
  // 선택형 과정 증거
  | 'multi_select'
  | 'single_select'
  | 'step_order'
  | 'error_spot'
  | 'path_choice'
  | 'state_select'
  | 'pattern_select'
  | 'edge_select'
  // 조작형 과정 증거
  | 'path_draw'
  | 'state_trace'
  | 'pattern_mark'
  | 'network_select'

export interface Choice {
  id: string
  text: string
}

export interface VisualSpec {
  /** 'grid'는 경로 그리기 문항의 격자를 읽기 전용으로 함께 보여 줍니다. */
  type: 'waterpark' | 'route' | 'robot' | 'pattern' | 'network' | 'grid' | 'custom' | 'none'
  src?: string
  alt?: string
}

export interface ProcessItem {
  id: string
  text: string
}

/** 경로 그리기형 과정 증거의 격자 정의입니다. */
export interface PathBoard {
  width: number
  height: number
  /** 'x,y' 형식. 좌표는 왼쪽 아래를 (1,1)로 봅니다. */
  start: string
  goal: string
  blocked: string[]
  /** 최소 이동 횟수. 비워 두면 격자에서 계산합니다. */
  optimalMoves?: number
}

export interface StateStage {
  id: string
  label: string
  options: ProcessItem[]
  correctId: string
}

/** 상태 추적형 과정 증거의 단계 정의입니다. */
export interface StateBoard {
  stages: StateStage[]
}

/** 패턴 표시형 과정 증거의 토큰 나열입니다. */
export interface PatternBoard {
  tokens: string[]
  /** 반복 단위의 길이(가장 작은 주기). */
  unitLength: number
}

export interface NetworkNode {
  id: string
  x: number
  y: number
  label?: string
}

export interface NetworkEdge {
  id: string
  from: string
  to: string
}

/** 네트워크 조작형 과정 증거의 그래프 정의입니다. */
export interface NetworkBoard {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  target: 'node' | 'edge' | 'both'
}

export interface ProcessStep {
  id: string
  type: ProcessType
  question: string
  instruction?: string
  items: ProcessItem[]
  /**
   * 정답의 표준 표현입니다.
   * - step_order: 항목 id의 정답 순서
   * - path_draw: 기준 경로의 칸 좌표 나열
   * - state_trace: 단계별 정답 옵션 id
   * - pattern_mark: 반복 단위 토큰의 인덱스
   * - network_select: 정답 노드·간선 id
   */
  correct: string[]
  maxSelections?: number
  ctElement: CtElement
  path?: PathBoard
  states?: StateBoard
  pattern?: PatternBoard
  network?: NetworkBoard
}

export interface TransferProblem {
  stem: string
  choices: Choice[]
  correctAnswer: string
  explanation: string
}

/** 학생 선택지를 겨냥한 반례 질문입니다. 정답은 담지 않습니다. */
export interface ChoiceProbe {
  choiceId: string
  question: string
}

export interface Problem {
  id: string
  version: number
  title: string
  category: string
  ctElements: CtElement[]
  stem: string
  rules?: string[]
  visual: VisualSpec
  choices: Choice[]
  correctAnswer: string
  explanation: string
  processSteps: ProcessStep[]
  transfer: TransferProblem
  /** 보조 태그. 점수 계산에는 쓰지 않습니다. */
  dokLevel?: DokLevel
  /** 정답을 알려주지 않는 단계별 힌트입니다. */
  hints?: string[]
  /** 학생이 고른 선택지를 흔들어 보는 반례 질문입니다. */
  choiceProbes?: ChoiceProbe[]
  origin?: 'built_in' | 'custom'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type RevisionReason =
  | 'missing_condition'
  | 'wrong_sequence'
  | 'wrong_intermediate_state'
  | 'better_strategy'
  | 'kept_answer'
  | 'other'

export interface ProcessStepResponse {
  stepId: string
  selections: string[]
  earned: number
  total: number
  exact: boolean
  /** 조작형 문항의 항목별 판정 근거입니다. */
  criteria?: Array<{ label: string; passed: boolean }>
}

export type TutorMode = 'hint' | 'counterexample' | 'debug'

/**
 * AI 도움 사용 기록입니다. 컴퓨팅 사고 점수에는 반영하지 않고
 * AI 활용 역량 프로파일에서만 사용합니다.
 */
export interface TutorUse {
  id: string
  problemId: string
  phase: 'process' | 'final'
  mode: TutorMode
  depth: number
  createdAt: string
  message: string
  /** 도움을 받은 시점의 임시 답입니다. */
  answerBefore: string
}

export interface ProblemResponse {
  problemId: string
  initialAnswer: string
  confidence: Confidence
  processResponses: ProcessStepResponse[]
  finalAnswer: string
  revisionReason: RevisionReason
  transferAnswer: string
  initialCorrect: boolean
  processCorrectCount: number
  processTotal: number
  finalCorrect: boolean
  transferCorrect: boolean
  startedAt: string
  completedAt: string
  elapsedMs: number
  /** 이 문제에서 사용한 AI 도움 횟수입니다. */
  tutorUseCount?: number
}

export interface JudgeEvent {
  id: string
  sessionId: string
  studentKey: string
  problemId: string
  eventType:
    | 'problem_opened'
    | 'initial_answer_submitted'
    | 'process_step_submitted'
    | 'final_answer_submitted'
    | 'transfer_submitted'
    | 'problem_completed'
    | 'tutor_requested'
  sequence: number
  elapsedMs: number
  createdAt: string
  payload: Record<string, unknown>
}

export interface Attempt {
  id: string
  sessionId: string
  studentKey: string
  nickname: string
  classCode: string
  startedAt: string
  completedAt: string
  responses: ProblemResponse[]
  events: JudgeEvent[]
  /** v0.6부터 기록합니다. 이전 기록에는 없을 수 있습니다. */
  tutorUses?: TutorUse[]
}

export interface CtProfileItem {
  element: CtElement
  label: string
  earned: number
  total: number
  percent: number
}

/** 확신도와 실제 정답의 어긋남을 봅니다. */
export interface CalibrationSummary {
  measured: number
  aligned: number
  overconfident: number
  underconfident: number
  percent: number
}

/** 과정 확인 뒤 답이 좋아졌는지 나빠졌는지 봅니다. */
export interface RevisionQuality {
  improved: number
  damaged: number
  keptCorrect: number
  keptWrong: number
}

/** 결과와 과정을 교차해서 추측 해결과 전략 해결을 구분합니다. */
export interface ResultProcessQuadrant {
  strategic: number
  likelyGuess: number
  slipped: number
  developing: number
}

/** AI 활용 역량은 컴퓨팅 사고 점수와 분리해서 봅니다. */
export interface AiUsageSummary {
  total: number
  byMode: Record<TutorMode, number>
  problemsWithHelp: number
  maxDepth: number
  revisedAfterHelp: number
  independentProblems: number
}

export interface ProblemCatalog {
  allProblems: Problem[]
  activeProblems: Problem[]
  customProblems: Problem[]
  disabledBuiltInIds: string[]
}
