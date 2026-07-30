import type {
  Confidence,
  CtElement,
  DokLevel,
  ProcessType,
  RevisionReason,
  TutorMode,
} from '../types'

export const ctLabels: Record<CtElement, string> = {
  abstraction: '추상화',
  decomposition: '문제 분해',
  algorithm: '알고리즘적 사고',
  evaluation: '평가·디버깅',
  pattern: '패턴 인식',
  generalization: '일반화·전이',
}

export const ctShortLabels: Record<CtElement, string> = {
  abstraction: '추상화',
  decomposition: '분해',
  algorithm: '알고리즘',
  evaluation: '검증',
  pattern: '패턴',
  generalization: '일반화',
}

export const confidenceLabels: Record<Confidence, string> = {
  high: '확실함',
  medium: '조금 확실함',
  low: '잘 모르겠음',
}

export const revisionReasonLabels: Record<RevisionReason, string> = {
  missing_condition: '빠뜨린 조건을 발견함',
  wrong_sequence: '해결 순서의 오류를 발견함',
  wrong_intermediate_state: '중간 상태를 잘못 판단함',
  better_strategy: '더 나은 전략을 찾음',
  kept_answer: '처음 답을 유지함',
  other: '그 밖의 이유',
}

export const processTypeLabels: Record<ProcessType, string> = {
  multi_select: '핵심 조건 선택',
  single_select: '하나 고르기',
  step_order: '해결 순서 배열',
  error_spot: '오류 찾기',
  path_choice: '경로 판단 근거',
  state_select: '중간 상태 고르기',
  pattern_select: '반복 단위 고르기',
  edge_select: '핵심 연결 고르기',
  path_draw: '경로 그리기',
  state_trace: '상태 추적',
  pattern_mark: '패턴 표시',
  network_select: '네트워크 조작',
}

/** DOK는 보조 태그입니다. 평가 축이 아니라 문항 검토용으로만 표시합니다. */
export const dokLabels: Record<DokLevel, string> = {
  1: 'DOK 1 · 회상·재현',
  2: 'DOK 2 · 개념 적용',
  3: 'DOK 3 · 전략적 사고',
  4: 'DOK 4 · 확장적 사고',
}

export const tutorModeLabels: Record<TutorMode, string> = {
  hint: '생각 힌트',
  counterexample: '반례 질문',
  debug: '디버깅 점검',
}

/** 문제 분류에 잘 맞는 과정 증거 유형입니다. 타당성 검토에서 사용합니다. */
export const categoryProcessFit: Array<{
  keywords: string[]
  label: string
  recommended: ProcessType[]
}> = [
  {
    keywords: ['조건', '규칙'],
    label: '조건·규칙 문제',
    recommended: ['multi_select', 'error_spot'],
  },
  {
    keywords: ['절차', '순서', '알고리즘'],
    label: '절차 문제',
    recommended: ['step_order'],
  },
  {
    keywords: ['경로', '최적화', '길'],
    label: '경로 문제',
    recommended: ['path_draw', 'path_choice'],
  },
  {
    keywords: ['상태', '변화', '시뮬'],
    label: '상태 변화 문제',
    recommended: ['state_trace', 'state_select'],
  },
  {
    keywords: ['패턴', '반복', '무늬'],
    label: '패턴 문제',
    recommended: ['pattern_mark', 'pattern_select'],
  },
  {
    keywords: ['네트워크', '관계', '통신', '그래프'],
    label: '네트워크 문제',
    recommended: ['network_select', 'edge_select'],
  },
  {
    keywords: ['디버깅', '오류', '버그'],
    label: '디버깅 문제',
    recommended: ['error_spot'],
  },
]
