import type {
  Choice,
  CtElement,
  DokLevel,
  Problem,
  ProcessItem,
  ProcessStep,
  ProcessType,
} from '../types'
import { ctLabels, processTypeLabels } from '../utils/labels'
import { smallestPeriod } from '../utils/grid'

/**
 * 문제 일괄 등록·내보내기입니다.
 * 교사가 실제 비버 문제를 표 형태로 정리한 뒤 JSON으로 한 번에 올릴 수 있게 합니다.
 */

export interface ImportIssue {
  index: number
  title: string
  messages: string[]
}

export interface ImportResult {
  problems: Problem[]
  issues: ImportIssue[]
  skipped: number
}

const validElements = new Set(Object.keys(ctLabels) as CtElement[])
const validTypes = new Set(Object.keys(processTypeLabels) as ProcessType[])

export function parseProblemPack(rawText: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch (error) {
    return {
      problems: [],
      issues: [
        {
          index: 0,
          title: '파일 전체',
          messages: [
            `JSON 형식이 올바르지 않습니다: ${
              error instanceof Error ? error.message : '알 수 없는 오류'
            }`,
          ],
        },
      ],
      skipped: 0,
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { problems?: unknown })?.problems)
      ? ((parsed as { problems: unknown[] }).problems)
      : null

  if (!list) {
    return {
      problems: [],
      issues: [
        {
          index: 0,
          title: '파일 전체',
          messages: ['문제 배열 또는 { "problems": [...] } 형태여야 합니다.'],
        },
      ],
      skipped: 0,
    }
  }

  const problems: Problem[] = []
  const issues: ImportIssue[] = []
  const seenIds = new Set<string>()

  list.forEach((entry, index) => {
    const outcome = normalizeProblem(entry, index, seenIds)
    if (outcome.problem) {
      problems.push(outcome.problem)
      seenIds.add(outcome.problem.id)
    }
    if (outcome.messages.length > 0) {
      issues.push({ index: index + 1, title: outcome.title, messages: outcome.messages })
    }
  })

  return { problems, issues, skipped: list.length - problems.length }
}

function normalizeProblem(entry: unknown, index: number, seenIds: Set<string>) {
  const messages: string[] = []
  const source = (entry ?? {}) as Record<string, unknown>
  const title = readString(source.title) || `${index + 1}번 문제`

  if (!readString(source.title)) messages.push('제목이 없어 임시 제목을 넣었습니다.')

  const choices = readChoices(source.choices)
  if (choices.length < 2) {
    messages.push('선택지가 두 개 이상 필요합니다. 이 문제는 건너뜁니다.')
    return { problem: null, title, messages }
  }

  const correctAnswer = readString(source.correctAnswer)
  const resolvedAnswer = choices.some((choice) => choice.id === correctAnswer)
    ? correctAnswer
    : choices[0].id
  if (resolvedAnswer !== correctAnswer) {
    messages.push(`정답이 선택지에 없어 ${resolvedAnswer}번으로 맞췄습니다. 확인이 필요합니다.`)
  }

  const transferSource = (source.transfer ?? {}) as Record<string, unknown>
  const transferChoices = readChoices(transferSource.choices)
  if (transferChoices.length < 2) {
    messages.push('전이 문제 선택지가 두 개 이상 필요합니다. 이 문제는 건너뜁니다.')
    return { problem: null, title, messages }
  }
  const transferAnswer = readString(transferSource.correctAnswer)
  const resolvedTransferAnswer = transferChoices.some((choice) => choice.id === transferAnswer)
    ? transferAnswer
    : transferChoices[0].id
  if (resolvedTransferAnswer !== transferAnswer) {
    messages.push('전이 문제 정답이 선택지에 없어 첫 선택지로 맞췄습니다.')
  }

  const rawSteps = Array.isArray(source.processSteps) ? source.processSteps : []
  const processSteps = rawSteps
    .map((step, stepIndex) => normalizeStep(step, stepIndex, messages))
    .filter((step): step is ProcessStep => step !== null)

  if (processSteps.length === 0) {
    messages.push('과정평가 문항이 없습니다. 결과만 남는 문항이 되므로 건너뜁니다.')
    return { problem: null, title, messages }
  }

  const timestamp = Date.now()
  let id = readString(source.id) || `imported-${timestamp}-${index + 1}`
  if (seenIds.has(id)) {
    id = `${id}-${index + 1}`
    messages.push('같은 id가 이미 있어 뒤에 번호를 붙였습니다.')
  }

  const elements = Array.isArray(source.ctElements)
    ? (source.ctElements.filter(
        (element): element is CtElement =>
          typeof element === 'string' && validElements.has(element as CtElement),
      ) as CtElement[])
    : []
  const resolvedElements =
    elements.length > 0 ? elements : [...new Set(processSteps.map((step) => step.ctElement))]

  const dokLevel = readDok(source.dokLevel)

  const problem: Problem = {
    id,
    version: typeof source.version === 'number' ? source.version : 1,
    title,
    category: readString(source.category) || '분류 미지정',
    ctElements: resolvedElements,
    stem: readString(source.stem) || title,
    rules: Array.isArray(source.rules)
      ? source.rules.map((rule) => readString(rule)).filter(Boolean)
      : undefined,
    visual: readVisual(source.visual),
    choices,
    correctAnswer: resolvedAnswer,
    explanation: readString(source.explanation) || '정답 설명이 비어 있습니다.',
    processSteps,
    transfer: {
      stem: readString(transferSource.stem) || '전이 문제 설명이 비어 있습니다.',
      choices: transferChoices,
      correctAnswer: resolvedTransferAnswer,
      explanation: readString(transferSource.explanation) || '전이 정답 설명이 비어 있습니다.',
    },
    dokLevel,
    hints: Array.isArray(source.hints)
      ? source.hints.map((hint) => readString(hint)).filter(Boolean)
      : [],
    choiceProbes: Array.isArray(source.choiceProbes)
      ? source.choiceProbes
          .map((probe) => {
            const record = (probe ?? {}) as Record<string, unknown>
            return {
              choiceId: readString(record.choiceId),
              question: readString(record.question),
            }
          })
          .filter((probe) => probe.choiceId && probe.question)
      : [],
    origin: 'custom',
    isActive: source.isActive === true,
  }

  return { problem, title, messages }
}

function normalizeStep(
  raw: unknown,
  stepIndex: number,
  messages: string[],
): ProcessStep | null {
  const source = (raw ?? {}) as Record<string, unknown>
  const typeText = readString(source.type)
  if (!validTypes.has(typeText as ProcessType)) {
    messages.push(`과정 ${stepIndex + 1}의 유형(${typeText || '없음'})을 알 수 없어 건너뜁니다.`)
    return null
  }
  const type = typeText as ProcessType

  const items: ProcessItem[] = Array.isArray(source.items)
    ? source.items
        .map((item, itemIndex) => {
          const record = (item ?? {}) as Record<string, unknown>
          return {
            id: readString(record.id) || `item-${stepIndex + 1}-${itemIndex + 1}`,
            text: readString(record.text),
          }
        })
        .filter((item) => item.text)
    : []

  const step: ProcessStep = {
    id: readString(source.id) || `process-${Date.now()}-${stepIndex + 1}`,
    type,
    question: readString(source.question) || '과정 확인 질문이 비어 있습니다.',
    instruction: readString(source.instruction) || undefined,
    items,
    correct: Array.isArray(source.correct)
      ? source.correct.map((value) => String(value))
      : [],
    maxSelections:
      typeof source.maxSelections === 'number' ? source.maxSelections : undefined,
    ctElement: validElements.has(readString(source.ctElement) as CtElement)
      ? (readString(source.ctElement) as CtElement)
      : 'abstraction',
  }

  if (type === 'path_draw' && source.path) {
    const path = source.path as Record<string, unknown>
    step.path = {
      width: Number(path.width) || 5,
      height: Number(path.height) || 5,
      start: readString(path.start) || '1,1',
      goal: readString(path.goal) || '5,5',
      blocked: Array.isArray(path.blocked) ? path.blocked.map((cell) => String(cell)) : [],
      optimalMoves: typeof path.optimalMoves === 'number' ? path.optimalMoves : undefined,
    }
  }

  if (type === 'state_trace' && source.states) {
    const states = source.states as Record<string, unknown>
    const stages = Array.isArray(states.stages) ? states.stages : []
    step.states = {
      stages: stages.map((stage, stageIndex) => {
        const record = (stage ?? {}) as Record<string, unknown>
        const options: ProcessItem[] = Array.isArray(record.options)
          ? record.options.map((option, optionIndex) => {
              const optionRecord = (option ?? {}) as Record<string, unknown>
              return {
                id: readString(optionRecord.id) || `state-${stageIndex + 1}-${optionIndex + 1}`,
                text: readString(optionRecord.text),
              }
            })
          : []
        return {
          id: readString(record.id) || `stage-${stageIndex + 1}`,
          label: readString(record.label) || `${stageIndex + 1}단계`,
          options,
          correctId: readString(record.correctId) || options[0]?.id || '',
        }
      }),
    }
    if (step.correct.length === 0) {
      step.correct = step.states.stages.map((stage) => stage.correctId)
    }
  }

  if (type === 'pattern_mark' && source.pattern) {
    const pattern = source.pattern as Record<string, unknown>
    const tokens = Array.isArray(pattern.tokens) ? pattern.tokens.map((token) => String(token)) : []
    const unitLength =
      typeof pattern.unitLength === 'number' && pattern.unitLength > 0
        ? pattern.unitLength
        : smallestPeriod(tokens)
    step.pattern = { tokens, unitLength }
    if (step.correct.length === 0) {
      step.correct = Array.from({ length: unitLength }, (_, index) => String(index))
    }
  }

  if (type === 'network_select' && source.network) {
    const network = source.network as Record<string, unknown>
    step.network = {
      nodes: Array.isArray(network.nodes)
        ? network.nodes.map((node, nodeIndex) => {
            const record = (node ?? {}) as Record<string, unknown>
            return {
              id: readString(record.id) || `N${nodeIndex + 1}`,
              x: Number(record.x) || 50,
              y: Number(record.y) || 50,
              label: readString(record.label) || undefined,
            }
          })
        : [],
      edges: Array.isArray(network.edges)
        ? network.edges.map((edge, edgeIndex) => {
            const record = (edge ?? {}) as Record<string, unknown>
            const from = readString(record.from)
            const to = readString(record.to)
            return {
              id: readString(record.id) || `${from}-${to}` || `E${edgeIndex + 1}`,
              from,
              to,
            }
          })
        : [],
      target:
        readString(network.target) === 'node'
          ? 'node'
          : readString(network.target) === 'both'
            ? 'both'
            : 'edge',
    }
  }

  if (step.correct.length === 0 && items.length > 0) {
    step.correct = [items[0].id]
    messages.push(`과정 ${stepIndex + 1}의 정답이 없어 첫 항목으로 지정했습니다. 확인이 필요합니다.`)
  }

  return step
}

function readChoices(value: unknown): Choice[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return { id: String.fromCharCode(65 + index), text: entry }
      }
      const record = (entry ?? {}) as Record<string, unknown>
      return {
        id: readString(record.id) || String.fromCharCode(65 + index),
        text: readString(record.text),
      }
    })
    .filter((choice) => choice.text)
}

function readVisual(value: unknown): Problem['visual'] {
  const record = (value ?? {}) as Record<string, unknown>
  const type = readString(record.type)
  const allowed = ['waterpark', 'route', 'robot', 'pattern', 'network', 'custom', 'none']
  return {
    type: (allowed.includes(type) ? type : 'none') as Problem['visual']['type'],
    src: readString(record.src) || undefined,
    alt: readString(record.alt) || undefined,
  }
}

function readDok(value: unknown): DokLevel | undefined {
  const level = Number(value)
  return level === 1 || level === 2 || level === 3 || level === 4 ? (level as DokLevel) : undefined
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

/** 교사가 편집해서 되돌릴 수 있도록 문제를 그대로 내려받습니다. */
export function downloadProblemPack(problems: Problem[], fileName: string) {
  const payload = {
    format: 'bebras-process-judge/problem-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    problems: problems.map((problem) => ({
      ...problem,
      origin: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    })),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

/** 일괄 등록 서식입니다. 교사가 이 구조만 맞추면 됩니다. */
export const importTemplate = `{
  "problems": [
    {
      "id": "bebras-2024-01",
      "title": "문제 제목",
      "category": "경로·최적화",
      "dokLevel": 3,
      "ctElements": ["algorithm", "evaluation"],
      "stem": "학생에게 보여 줄 문제 상황입니다.",
      "rules": ["규칙 1", "규칙 2"],
      "visual": { "type": "none" },
      "choices": [
        { "id": "A", "text": "선택지 A" },
        { "id": "B", "text": "선택지 B" },
        { "id": "C", "text": "선택지 C" }
      ],
      "correctAnswer": "B",
      "explanation": "정답 설명입니다.",
      "hints": [
        "무엇을 결정해야 하는지 다시 써 보세요.",
        "규칙 중 실제로 쓰이는 것을 골라 보세요."
      ],
      "choiceProbes": [
        { "choiceId": "A", "question": "A가 맞다면 어떤 규칙이 필요 없어야 할까요?" }
      ],
      "processSteps": [
        {
          "id": "step-1",
          "type": "path_draw",
          "question": "가장 짧은 경로를 그려 보세요.",
          "ctElement": "algorithm",
          "items": [],
          "correct": [],
          "path": {
            "width": 6,
            "height": 5,
            "start": "1,1",
            "goal": "6,5",
            "blocked": ["3,1", "3,2", "3,3"]
          }
        }
      ],
      "transfer": {
        "stem": "표면이 다른 새 상황입니다.",
        "choices": [
          { "id": "A", "text": "선택지 A" },
          { "id": "B", "text": "선택지 B" }
        ],
        "correctAnswer": "A",
        "explanation": "전이 정답 설명입니다."
      }
    }
  ]
}`
