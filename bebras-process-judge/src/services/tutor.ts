import type { Problem, ProcessStep, TutorMode } from '../types'
import { checkDrawnPath } from '../utils/grid'

/**
 * 정답을 알려주지 않는 도움말 생성기입니다.
 *
 * 원칙
 * - 정답 선택지나 정답 문자를 절대 말하지 않습니다.
 * - 답이 맞았는지 틀렸는지 판정해 주지 않습니다.
 * - 문제에 이미 적혀 있는 규칙 위반만 알려 줍니다.
 * - 서버나 외부 모델을 부르지 않고 문제 자체에서 질문을 만듭니다.
 */

export interface TutorReply {
  mode: TutorMode
  depth: number
  message: string
  /** 더 깊은 힌트가 남아 있는지 여부입니다. */
  hasMore: boolean
}

const SAFE_FALLBACK =
  '문제에 적힌 규칙을 하나씩 짚으면서, 네가 정한 답이 모든 규칙을 어기지 않는지 직접 확인해 보세요.'

/** 유형별 전략 질문입니다. 어떤 것도 정답을 담지 않습니다. */
const strategyByCategory: Array<{ keywords: string[]; strategy: string }> = [
  {
    keywords: ['조건', '규칙'],
    strategy:
      '등장하는 대상을 한 줄씩 적고, 각 대상마다 규칙을 순서대로 통과시키는 표를 만들어 보세요.',
  },
  {
    keywords: ['절차', '순서', '알고리즘'],
    strategy:
      '네가 생각한 순서를 종이에 적고, 두 단계의 자리를 바꾸면 결과가 달라지는지 확인해 보세요.',
  },
  {
    keywords: ['경로', '최적화', '길'],
    strategy:
      '막힌 칸을 먼저 모두 표시하고, 출발점에서 한 칸씩 번호를 붙여 가며 도착점까지 몇 번 걸리는지 세어 보세요.',
  },
  {
    keywords: ['상태', '변화', '시뮬'],
    strategy:
      '명령을 하나 실행할 때마다 위치와 방향을 따로 적어 보세요. 머릿속으로 두 개를 동시에 기억하면 틀리기 쉽습니다.',
  },
  {
    keywords: ['패턴', '반복', '무늬'],
    strategy:
      '앞에서부터 길이 1, 2, 3인 덩어리를 차례로 잡아 보고, 그 덩어리를 계속 붙였을 때 전체와 같아지는지 확인해 보세요.',
  },
  {
    keywords: ['네트워크', '관계', '통신', '그래프'],
    strategy:
      '선을 하나 지웠다고 생각하고, 남은 선만으로 두 지점을 이을 수 있는지 손가락으로 따라가 보세요.',
  },
]

function strategyFor(problem: Problem) {
  const found = strategyByCategory.find((item) =>
    item.keywords.some((keyword) => problem.category.includes(keyword)),
  )
  return found?.strategy ?? '문제를 더 작은 질문 두세 개로 나누고, 하나씩 답해 보세요.'
}

/** 정답이 새어 나갔는지 확인합니다. */
export function leaksAnswer(message: string, problem: Problem) {
  const normalized = message.replace(/\s+/g, '').toLowerCase()
  const correctChoice = problem.choices.find((choice) => choice.id === problem.correctAnswer)
  if (correctChoice) {
    const answerText = correctChoice.text.replace(/\s+/g, '').toLowerCase()
    if (answerText.length >= 6 && normalized.includes(answerText)) return true
  }
  if (new RegExp(`정답은${problem.correctAnswer}`, 'i').test(normalized)) return true
  if (/정답은|답은[a-d]다|맞았|틀렸/i.test(normalized)) return true
  return false
}

function guard(message: string, problem: Problem) {
  return leaksAnswer(message, problem) ? SAFE_FALLBACK : message
}

/** 단계가 올라갈수록 구체적이지만, 마지막까지 정답은 말하지 않습니다. */
export function buildHint(problem: Problem, depth: number): TutorReply {
  const authored = (problem.hints ?? []).filter((hint) => hint.trim().length > 0)
  const ruleCount = (problem.rules ?? []).filter(Boolean).length

  const generated = [
    '이 문제가 최종적으로 무엇을 결정하라고 하는지 한 문장으로 다시 써 보세요. 묻는 것이 분명해지면 필요한 정보도 드러납니다.',
    ruleCount > 0
      ? `문제에 규칙이 ${ruleCount}개 있습니다. 그중 판단에 실제로 쓰이는 규칙과 배경 설명일 뿐인 문장을 나누어 보세요.`
      : '문제 설명에서 판단에 꼭 필요한 문장과 분위기를 만드는 문장을 나누어 보세요.',
    strategyFor(problem),
    '네가 정한 답을 하나씩 규칙에 넣어 보세요. 규칙 중 하나라도 어기면 그 답은 성립하지 않습니다.',
  ]

  const ladder = authored.length > 0 ? authored : generated
  const index = Math.min(Math.max(depth, 1), ladder.length) - 1

  return {
    mode: 'hint',
    depth: index + 1,
    message: guard(ladder[index], problem),
    hasMore: index < ladder.length - 1,
  }
}

/** 학생이 지금 고른 답을 흔들어 보는 반례 질문입니다. */
export function buildCounterexample(problem: Problem, currentAnswer: string): TutorReply {
  const probe = problem.choiceProbes?.find((item) => item.choiceId === currentAnswer)
  if (probe && probe.question.trim().length > 0) {
    return { mode: 'counterexample', depth: 1, message: guard(probe.question, problem), hasMore: false }
  }

  if (!currentAnswer) {
    return {
      mode: 'counterexample',
      depth: 1,
      message:
        '아직 고른 답이 없습니다. 먼저 하나를 골라 보세요. 그러면 그 답이 무너지는 상황을 함께 찾아볼 수 있습니다.',
      hasMore: false,
    }
  }

  const message =
    `${currentAnswer}번이 맞다고 가정해 봅시다. 그렇다면 문제의 규칙 중 하나는 쓸 필요가 없어야 합니다. ` +
    '어느 규칙이 남는지 찾아보고, 그 규칙을 정말 무시해도 되는지 확인해 보세요. ' +
    '무시할 수 없다면 가정이 잘못된 것입니다.'

  return { mode: 'counterexample', depth: 1, message: guard(message, problem), hasMore: false }
}

/**
 * 학생이 남긴 과정 증거를 근거로 스스로 점검할 지점을 알려 줍니다.
 * 어느 선택이 맞았는지는 말하지 않고, 문제에 적힌 규칙 위반만 지적합니다.
 */
export function buildDebugPrompt(
  problem: Problem,
  processAnswers: Record<string, string[]>,
  /** 학생이 지금 보고 있는 과정 문항 번호입니다. 아직 만나지 않은 문항은 건드리지 않습니다. */
  visibleStepCount = problem.processSteps.length,
): TutorReply {
  const notes: string[] = []

  problem.processSteps.slice(0, Math.max(1, visibleStepCount)).forEach((step) => {
    const selections = processAnswers[step.id] ?? []
    const note = debugNoteForStep(step, selections)
    if (note) notes.push(note)
  })

  const message =
    notes.length > 0
      ? notes.slice(-2).reverse().join(' ')
      : '지금까지 남긴 과정 기록을 다시 읽어 보세요. 각 판단마다 "왜 그렇게 정했는지"를 한 문장으로 말할 수 있어야 합니다.'

  return { mode: 'debug', depth: 1, message: guard(message, problem), hasMore: false }
}

function debugNoteForStep(step: ProcessStep, selections: string[]): string | null {
  if (selections.length === 0) {
    return `“${step.question}”에 아직 답하지 않았습니다. 여기서 막힌 이유를 한 문장으로 적어 보세요.`
  }

  if (step.type === 'multi_select' || step.type === 'path_choice') {
    return (
      `정보를 ${selections.length}가지 골랐습니다. 그중 하나를 지웠다고 생각해 보세요. ` +
      '답이 달라지지 않는 정보라면 애초에 필요하지 않은 정보입니다.'
    )
  }

  if (step.type === 'step_order') {
    return '네가 정한 순서에서 첫 번째와 두 번째 단계를 바꿔 보세요. 결과가 같다면 그 두 단계의 순서는 중요하지 않다는 뜻입니다.'
  }

  if (step.type === 'path_draw' && step.path) {
    const check = checkDrawnPath(step.path, selections)
    if (!check.startsAtStart || !check.endsAtGoal) {
      return '그린 경로가 출발점에서 시작해 도착점에서 끝나는지 확인해 보세요.'
    }
    if (!check.connected || !check.noRevisit) {
      return '경로가 중간에 끊기거나 같은 칸을 다시 지나지 않는지 확인해 보세요.'
    }
    if (!check.avoidsBlocked) {
      return '지금 경로는 지나갈 수 없는 칸을 통과합니다. 문제의 규칙을 다시 읽고 그 칸을 피해 보세요.'
    }
    return `지금 경로는 ${check.moves}번 이동합니다. 한 칸이라도 줄일 수 있는 방법이 있는지 다른 길을 그려 비교해 보세요.`
  }

  if (step.type === 'state_trace') {
    return '단계마다 위치와 방향을 종이에 따로 적고, 네가 고른 상태와 하나씩 맞춰 보세요.'
  }

  if (step.type === 'pattern_mark') {
    return `표시한 덩어리 ${selections.length}칸을 계속 이어 붙이면 전체 무늬와 같아지는지 확인해 보세요.`
  }

  if (step.type === 'network_select' || step.type === 'edge_select') {
    return '고른 연결을 지웠다고 생각하고, 남은 연결만으로 모든 지점을 오갈 수 있는지 따라가 보세요.'
  }

  return null
}

export const tutorPolicyNote =
  'AI 도움은 최초 답 제출과 전이 문제에서는 사용할 수 없습니다. 도움 기록은 컴퓨팅 사고 점수와 분리해 AI 활용 역량으로만 남습니다.'
