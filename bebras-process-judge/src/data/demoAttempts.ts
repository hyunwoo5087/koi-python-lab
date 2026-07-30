import type { Attempt, Problem, ProblemResponse, RevisionReason, TutorUse } from '../types'
import { judgeProblemProcess } from '../judge/judge'
import { buildHint } from '../services/tutor'

const patterns = [
  { name: '지우', initial: [true, true, false, true, false], final: [true, true, true, true, true], transfer: [true, true, false, true, false] },
  { name: '민준', initial: [false, true, false, true, true], final: [true, true, false, true, true], transfer: [false, true, false, true, true] },
  { name: '서연', initial: [true, false, true, false, true], final: [true, true, true, false, true], transfer: [true, false, true, false, true] },
]

export function createDemoAttempts(problems: Problem[]): Attempt[] {
  return patterns.map((pattern, attemptIndex) => {
    const started = new Date(Date.now() - (attemptIndex + 1) * 86_400_000)
    const responses: ProblemResponse[] = problems.map((problem, index) => {
      const initialCorrect = pattern.initial[index % pattern.initial.length] ?? false
      const finalCorrect = pattern.final[index % pattern.final.length] ?? false
      const transferCorrect = pattern.transfer[index % pattern.transfer.length] ?? false
      const initialAnswer = initialCorrect ? problem.correctAnswer : wrongAnswer(problem.correctAnswer, problem.choices.map((choice) => choice.id))
      const finalAnswer = finalCorrect ? problem.correctAnswer : wrongAnswer(problem.correctAnswer, problem.choices.map((choice) => choice.id))
      const processAnswers = Object.fromEntries(
        problem.processSteps.map((step, stepIndex) => {
          const shouldMiss = index === attemptIndex && stepIndex === 0
          const selections = shouldMiss ? makeImperfect(step.correct, step.items.map((item) => item.id), step.type) : [...step.correct]
          return [step.id, selections]
        }),
      )
      const process = judgeProblemProcess(problem, processAnswers)
      return {
        problemId: problem.id,
        initialAnswer,
        confidence: initialCorrect ? 'high' : 'medium',
        processResponses: process.processResponses,
        finalAnswer,
        revisionReason: (initialAnswer === finalAnswer ? 'kept_answer' : 'missing_condition') as RevisionReason,
        transferAnswer: transferCorrect ? problem.transfer.correctAnswer : wrongAnswer(problem.transfer.correctAnswer, problem.transfer.choices.map((choice) => choice.id)),
        initialCorrect,
        processCorrectCount: process.earned,
        processTotal: process.total,
        finalCorrect,
        transferCorrect,
        startedAt: new Date(started.getTime() + index * 90_000).toISOString(),
        completedAt: new Date(started.getTime() + index * 90_000 + 70_000).toISOString(),
        elapsedMs: 70_000,
        tutorUseCount: initialCorrect ? 0 : 1,
      }
    })

    // AI 도움은 컴퓨팅 사고 점수와 분리되므로 예시에서도 따로 기록합니다.
    const tutorUses: TutorUse[] = problems
      .filter((_, index) => !(pattern.initial[index % pattern.initial.length] ?? false))
      .map((problem, order) => {
        const reply = buildHint(problem, 1)
        return {
          id: `demo-tutor-${attemptIndex}-${order}`,
          problemId: problem.id,
          phase: 'process' as const,
          mode: reply.mode,
          depth: reply.depth,
          createdAt: new Date(started.getTime() + order * 90_000 + 40_000).toISOString(),
          message: reply.message,
          answerBefore: problem.choices[0]?.id ?? 'A',
        }
      })

    const completed = new Date(started.getTime() + responses.length * 90_000)
    return {
      id: `demo-v3-${attemptIndex}-${Date.now()}`,
      sessionId: `demo-session-${attemptIndex}`,
      studentKey: `demo-student-${attemptIndex}`,
      nickname: pattern.name,
      classCode: 'DEMO-6A',
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      responses,
      events: [],
      tutorUses,
    }
  })
}

function makeImperfect(correct: string[], allIds: string[], type: string) {
  if (type === 'step_order' && correct.length > 1) {
    const next = [...correct]
    ;[next[0], next[1]] = [next[1], next[0]]
    return next
  }
  if (correct.length > 1) return correct.slice(0, correct.length - 1)
  return [allIds.find((id) => !correct.includes(id)) ?? correct[0]]
}

function wrongAnswer(correct: string, choiceIds: string[]) {
  return choiceIds.find((item) => item !== correct) ?? choiceIds[0] ?? 'A'
}
