import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Attempt,
  Confidence,
  JudgeEvent,
  Problem,
  ProblemResponse,
  ProcessStep,
  RevisionReason,
  TutorUse,
} from '../types'
import { ChoiceList } from './ChoiceList'
import { ProblemVisual } from './ProblemVisual'
import { ProcessPrompt } from './ProcessPrompt'
import { ProgressBar } from './ProgressBar'
import { ResultProfile } from './ResultProfile'
import { TutorPanel } from './TutorPanel'
import { judgeProblemProcess } from '../judge/judge'
import { createJudgeEvent } from '../services/eventLogger'
import { saveAttempt } from '../services/storage'
import type { TutorReply } from '../services/tutor'
import { confidenceLabels, ctShortLabels, dokLabels, revisionReasonLabels } from '../utils/labels'
import { shuffleAwayFromAnswer } from '../utils/shuffle'

type Phase = 'initial' | 'process' | 'final' | 'transfer' | 'complete'

interface Draft {
  initialAnswer: string
  confidence: Confidence | ''
  processAnswers: Record<string, string[]>
  finalAnswer: string
  revisionReason: RevisionReason | ''
  transferAnswer: string
}

const emptyDraft: Draft = {
  initialAnswer: '',
  confidence: '',
  processAnswers: {},
  finalAnswer: '',
  revisionReason: '',
  transferAnswer: '',
}

export function StudentRunner({
  problems,
  nickname,
  classCode,
  onBack,
  onOpenDashboard,
  onAttemptCompleted,
  serverMode = false,
  tutorEnabled = true,
}: {
  problems: Problem[]
  nickname: string
  classCode: string
  onBack: () => void
  onOpenDashboard: () => void
  onAttemptCompleted?: (attempt: Attempt) => Promise<void> | void
  serverMode?: boolean
  tutorEnabled?: boolean
}) {
  const [problemIndex, setProblemIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('initial')
  const [processStepIndex, setProcessStepIndex] = useState(0)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [responses, setResponses] = useState<ProblemResponse[]>([])
  const [events, setEvents] = useState<JudgeEvent[]>([])
  const [tutorUses, setTutorUses] = useState<TutorUse[]>([])
  const sessionId = useRef(crypto.randomUUID())
  const studentKey = useRef(`student-${crypto.randomUUID()}`)
  const attemptId = useRef(crypto.randomUUID())
  const attemptStartedAt = useRef(new Date().toISOString())
  const problemStartedAt = useRef(Date.now())
  const eventSequence = useRef(0)
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null)
  const [serverSaveState, setServerSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>(
    'idle',
  )

  const problem = problems[problemIndex]
  const currentProcessStep = problem?.processSteps[processStepIndex]
  const progressCurrent = phase === 'complete' ? problems.length : problemIndex + 1

  const phaseTitle = useMemo(() => {
    if (!problem) return '문제 없음'
    if (phase === 'initial') return '독립 풀이'
    if (phase === 'process') return `과정 확인 ${processStepIndex + 1}/${problem.processSteps.length}`
    if (phase === 'final') return '최종 판단'
    if (phase === 'transfer') return '새 문제에 적용'
    return '완료'
  }, [phase, problem, processStepIndex])

  useEffect(() => {
    if (!problem || phase === 'complete') return
    problemStartedAt.current = Date.now()
    const event = makeEvent('problem_opened', { problemVersion: problem.version })
    setEvents((previous) => [...previous, event])
    // 문제 번호가 바뀔 때만 새 문제 열기 이벤트를 기록합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemIndex])

  if (!problem && phase !== 'complete') {
    return (
      <main className="app-shell student-page">
        <section className="panel empty-state">
          <div className="empty-icon">⌁</div>
          <h2>풀 수 있는 문제가 없습니다.</h2>
          <p>교사 화면의 문제 제작·관리에서 문제를 공개하거나, 과제 코드를 다시 확인해 주세요.</p>
          <div className="button-row center">
            <button className="button primary" onClick={onBack}>
              처음으로
            </button>
          </div>
        </section>
      </main>
    )
  }

  function makeEvent(
    eventType: JudgeEvent['eventType'],
    payload: Record<string, unknown> = {},
  ) {
    eventSequence.current += 1
    return createJudgeEvent({
      sessionId: sessionId.current,
      studentKey: studentKey.current,
      problemId: problem?.id ?? '',
      eventType,
      sequence: eventSequence.current,
      elapsedMs: Date.now() - problemStartedAt.current,
      payload,
    })
  }

  function log(eventType: JudgeEvent['eventType'], payload: Record<string, unknown> = {}) {
    const event = makeEvent(eventType, payload)
    setEvents((previous) => [...previous, event])
  }

  /**
   * AI 도움 사용을 기록합니다.
   * 컴퓨팅 사고 점수에는 반영하지 않고 AI 활용 역량 프로파일에서만 씁니다.
   */
  function recordTutorUse(reply: TutorReply) {
    const use: TutorUse = {
      id: crypto.randomUUID(),
      problemId: problem.id,
      phase: phase === 'final' ? 'final' : 'process',
      mode: reply.mode,
      depth: reply.depth,
      createdAt: new Date().toISOString(),
      message: reply.message,
      answerBefore: phase === 'final' ? draft.finalAnswer : draft.initialAnswer,
    }
    setTutorUses((previous) => [...previous, use])
    log('tutor_requested', { mode: reply.mode, depth: reply.depth, phase: use.phase })
  }

  function submitInitial() {
    if (!draft.initialAnswer || !draft.confidence) return
    log('initial_answer_submitted', {
      answer: draft.initialAnswer,
      confidence: draft.confidence,
    })
    setDraft((previous) => ({ ...previous, finalAnswer: previous.initialAnswer }))
    setProcessStepIndex(0)
    setPhase('process')
  }

  function submitProcessStep() {
    if (!currentProcessStep) return
    const selections = getActiveProcessSelections(currentProcessStep.id)
    if (!isStepReady(currentProcessStep, selections)) return

    const nextAnswers = {
      ...draft.processAnswers,
      [currentProcessStep.id]: selections,
    }

    log('process_step_submitted', {
      stepId: currentProcessStep.id,
      stepType: currentProcessStep.type,
      selections,
    })

    setDraft((previous) => ({ ...previous, processAnswers: nextAnswers }))

    if (processStepIndex < problem.processSteps.length - 1) {
      setProcessStepIndex((previous) => previous + 1)
    } else {
      setPhase('final')
    }
  }

  function submitFinal() {
    if (!draft.finalAnswer || !draft.revisionReason) return
    log('final_answer_submitted', {
      answer: draft.finalAnswer,
      revisionReason: draft.revisionReason,
      changed: draft.finalAnswer !== draft.initialAnswer,
    })
    setPhase('transfer')
  }

  function submitTransfer() {
    if (!draft.transferAnswer) return

    const transferEvent = makeEvent('transfer_submitted', { answer: draft.transferAnswer })
    const processResult = judgeProblemProcess(problem, draft.processAnswers)
    const now = new Date()
    const response: ProblemResponse = {
      problemId: problem.id,
      initialAnswer: draft.initialAnswer,
      confidence: draft.confidence as Confidence,
      processResponses: processResult.processResponses,
      finalAnswer: draft.finalAnswer,
      revisionReason: draft.revisionReason as RevisionReason,
      transferAnswer: draft.transferAnswer,
      initialCorrect: draft.initialAnswer === problem.correctAnswer,
      processCorrectCount: processResult.earned,
      processTotal: processResult.total,
      finalCorrect: draft.finalAnswer === problem.correctAnswer,
      transferCorrect: draft.transferAnswer === problem.transfer.correctAnswer,
      startedAt: new Date(problemStartedAt.current).toISOString(),
      completedAt: now.toISOString(),
      elapsedMs: Date.now() - problemStartedAt.current,
      tutorUseCount: tutorUses.filter((use) => use.problemId === problem.id).length,
    }
    const completedEvent = makeEvent('problem_completed', {
      initialCorrect: response.initialCorrect,
      processEarned: response.processCorrectCount,
      processTotal: response.processTotal,
      finalCorrect: response.finalCorrect,
      transferCorrect: response.transferCorrect,
      tutorUseCount: response.tutorUseCount,
    })

    const nextResponses = [...responses, response]
    const nextEvents = [...events, transferEvent, completedEvent]
    setResponses(nextResponses)
    setEvents(nextEvents)

    if (problemIndex === problems.length - 1) {
      const attempt: Attempt = {
        id: attemptId.current,
        sessionId: sessionId.current,
        studentKey: studentKey.current,
        nickname,
        classCode,
        startedAt: attemptStartedAt.current,
        completedAt: now.toISOString(),
        responses: nextResponses,
        events: nextEvents,
        tutorUses,
      }
      saveAttempt(attempt)
      setCompletedAttempt(attempt)
      setPhase('complete')
      if (onAttemptCompleted) {
        setServerSaveState('saving')
        void Promise.resolve(onAttemptCompleted(attempt))
          .then(() => setServerSaveState('saved'))
          .catch(() => setServerSaveState('failed'))
      }
      return
    }

    setProblemIndex((previous) => previous + 1)
    setProcessStepIndex(0)
    setDraft(emptyDraft)
    setPhase('initial')
  }

  /** 저장된 답이 없으면 유형에 맞는 초기값을 만듭니다. */
  function getActiveProcessSelections(stepId: string) {
    const saved = draft.processAnswers[stepId]
    if (saved) return saved
    const step = problem.processSteps.find((item) => item.id === stepId)
    if (!step) return []

    if (step.type === 'step_order') {
      // 저자가 입력한 순서가 곧 정답이 되지 않도록 학생마다 다르게 섞습니다.
      return shuffleAwayFromAnswer(
        step.items.map((item) => item.id),
        step.correct,
        `${studentKey.current}:${step.id}`,
      )
    }
    if (step.type === 'state_trace') {
      return (step.states?.stages ?? []).map(() => '')
    }
    return []
  }

  function updateProcessSelections(stepId: string, selections: string[]) {
    setDraft((previous) => ({
      ...previous,
      processAnswers: {
        ...previous.processAnswers,
        [stepId]: selections,
      },
    }))
  }

  if (phase === 'complete' && completedAttempt) {
    return (
      <main className="app-shell student-page">
        <header className="runner-header">
          <button type="button" className="brand-button" onClick={onBack}>
            <span className="brand-mark">B</span>
            <span>
              <strong>비버 사고과정 저지</strong>
              <small>
                {classCode} · {nickname}
              </small>
            </span>
          </button>
          <div className="phase-chip">
            <span>✓</span>완료
          </div>
        </header>

        <div className="completion-banner">
          <div className="completion-symbol">✓</div>
          <div>
            <div className="eyebrow">평가 완료</div>
            <h1>{nickname} 학생, 수고했습니다.</h1>
            <p>정답과 함께 문제 해결 과정 및 새로운 문제 적용 결과가 저장되었습니다.</p>
            {serverMode && (
              <p className={`server-save-status ${serverSaveState}`}>
                {serverSaveState === 'saving'
                  ? '서버에 제출하는 중입니다…'
                  : serverSaveState === 'saved'
                    ? '서버 제출이 완료되었습니다.'
                    : serverSaveState === 'failed'
                      ? '서버 제출에 실패했지만 이 브라우저에는 안전하게 저장되었습니다.'
                      : '서버 제출을 준비하고 있습니다.'}
              </p>
            )}
          </div>
        </div>

        <ResultProfile attempt={completedAttempt} problems={problems} />
        <div className="button-row center">
          <button className="button ghost" onClick={onBack}>
            처음으로
          </button>
          <button className="button primary" onClick={onOpenDashboard}>
            교사 대시보드 보기
          </button>
        </div>
      </main>
    )
  }

  const activeProcessSelections = currentProcessStep
    ? getActiveProcessSelections(currentProcessStep.id)
    : []
  const processReady = currentProcessStep
    ? isStepReady(currentProcessStep, activeProcessSelections)
    : false

  // AI 도움은 최초 답과 전이 단계에서 쓸 수 없습니다.
  const tutorVisible = tutorEnabled && (phase === 'process' || phase === 'final')

  return (
    <main className="app-shell student-page">
      <header className="runner-header">
        <button type="button" className="brand-button" onClick={onBack} aria-label="처음 화면으로">
          <span className="brand-mark">B</span>
          <span>
            <strong>비버 사고과정 저지</strong>
            <small>
              {classCode} · {nickname}
            </small>
          </span>
        </button>
        <div className="phase-chip">
          <span>{problemIndex + 1}</span>
          {phaseTitle}
        </div>
      </header>

      <ProgressBar current={progressCurrent} total={problems.length} />

      <section className="problem-card panel">
        <div className="problem-heading">
          <div>
            <div className="eyebrow">{problem.category}</div>
            <h1>{problem.title}</h1>
          </div>
          <div className="ct-tags">
            {problem.ctElements.map((element) => (
              <span key={element}>{ctShortLabels[element]}</span>
            ))}
            {problem.dokLevel !== undefined && (
              <span className="dok-chip" title="보조 태그입니다. 점수에 반영되지 않습니다.">
                {dokLabels[problem.dokLevel]}
              </span>
            )}
          </div>
        </div>

        {phase !== 'transfer' && (
          <>
            <p className="problem-stem">{problem.stem}</p>
            {problem.rules && problem.rules.length > 0 && (
              <div className="rules-box">
                {problem.rules.map((rule, index) => (
                  <div key={`${rule}-${index}`}>
                    <span>{index + 1}</span>
                    <p>{rule}</p>
                  </div>
                ))}
              </div>
            )}
            {/* 지금 조작하는 격자와 똑같은 그림을 위에 또 보여 주지 않습니다. */}
            {!(problem.visual.type === 'grid' && currentProcessStep?.type === 'path_draw') && (
              <ProblemVisual visual={problem.visual} problem={problem} />
            )}
          </>
        )}

        {phase === 'initial' && (
          <section className="phase-section">
            <div className="section-title-row">
              <h2>나의 첫 번째 답</h2>
              <span className="lock-note">AI·힌트 없이 제출</span>
            </div>
            <ChoiceList
              choices={problem.choices}
              value={draft.initialAnswer}
              onChange={(value) => setDraft((previous) => ({ ...previous, initialAnswer: value }))}
            />
            <div className="confidence-box">
              <strong>내 답이 맞다고 얼마나 확신하나요?</strong>
              <div className="segmented">
                {(Object.keys(confidenceLabels) as Confidence[]).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={draft.confidence === value ? 'selected' : ''}
                    onClick={() => setDraft((previous) => ({ ...previous, confidence: value }))}
                  >
                    {confidenceLabels[value]}
                  </button>
                ))}
              </div>
            </div>
            <div className="button-row end">
              <button
                className="button primary"
                disabled={!draft.initialAnswer || !draft.confidence}
                onClick={submitInitial}
              >
                첫 답 제출
              </button>
            </div>
          </section>
        )}

        {phase === 'process' && currentProcessStep && (
          <section className="phase-section">
            <ProcessPrompt
              prompt={currentProcessStep}
              selections={activeProcessSelections}
              onChange={(selections) => updateProcessSelections(currentProcessStep.id, selections)}
              stepNumber={processStepIndex + 1}
              stepTotal={problem.processSteps.length}
              shuffleSeed={studentKey.current}
            />
            <div className="button-row end">
              <button className="button primary" disabled={!processReady} onClick={submitProcessStep}>
                {processStepIndex === problem.processSteps.length - 1
                  ? '과정 기록 완료'
                  : '다음 과정 확인'}
              </button>
            </div>
          </section>
        )}

        {phase === 'final' && (
          <section className="phase-section">
            <div className="answer-compare">
              <div>
                <span>첫 답</span>
                <strong>{draft.initialAnswer}</strong>
              </div>
              <div className="arrow">→</div>
              <div>
                <span>최종 답</span>
                <strong>{draft.finalAnswer || '-'}</strong>
              </div>
            </div>
            <h2>과정을 확인한 뒤 최종 답을 정하세요.</h2>
            <ChoiceList
              choices={problem.choices}
              value={draft.finalAnswer}
              onChange={(value) =>
                setDraft((previous) => ({ ...previous, finalAnswer: value, revisionReason: '' }))
              }
            />
            <div className="revision-box">
              <strong>답을 유지하거나 바꾼 이유를 고르세요.</strong>
              <div className="revision-options">
                {(Object.keys(revisionReasonLabels) as RevisionReason[])
                  .filter(
                    (reason) => reason !== 'kept_answer' || draft.finalAnswer === draft.initialAnswer,
                  )
                  .map((reason) => (
                    <button
                      type="button"
                      key={reason}
                      className={draft.revisionReason === reason ? 'selected' : ''}
                      onClick={() => setDraft((previous) => ({ ...previous, revisionReason: reason }))}
                    >
                      {revisionReasonLabels[reason]}
                    </button>
                  ))}
              </div>
            </div>
            <div className="button-row end">
              <button
                className="button primary"
                disabled={!draft.finalAnswer || !draft.revisionReason}
                onClick={submitFinal}
              >
                최종 답 제출
              </button>
            </div>
          </section>
        )}

        {phase === 'transfer' && (
          <section className="phase-section transfer-section">
            <div className="transfer-badge">AI·힌트 없이</div>
            <div className="eyebrow">전이 문제</div>
            <h1>같은 원리를 새로운 상황에 적용해 보세요.</h1>
            <p className="problem-stem">{problem.transfer.stem}</p>
            <ChoiceList
              choices={problem.transfer.choices}
              value={draft.transferAnswer}
              onChange={(value) => setDraft((previous) => ({ ...previous, transferAnswer: value }))}
            />
            <div className="button-row end">
              <button
                className="button primary"
                disabled={!draft.transferAnswer}
                onClick={submitTransfer}
              >
                {problemIndex === problems.length - 1 ? '평가 완료' : '다음 문제'}
              </button>
            </div>
          </section>
        )}
      </section>

      {tutorVisible && (
        <TutorPanel
          problem={problem}
          currentAnswer={phase === 'final' ? draft.finalAnswer : draft.initialAnswer}
          processAnswers={draft.processAnswers}
          visibleStepCount={phase === 'final' ? problem.processSteps.length : processStepIndex + 1}
          onUse={recordTutorUse}
        />
      )}
    </main>
  )
}

/** 유형마다 '답을 다 했다'의 기준이 다릅니다. */
export function isStepReady(step: ProcessStep, selections: string[]) {
  if (step.type === 'step_order') return selections.length === step.items.length
  if (step.type === 'path_draw') return selections.length >= 2
  if (step.type === 'state_trace') {
    const stages = step.states?.stages ?? []
    return stages.length > 0 && stages.every((_, index) => Boolean(selections[index]))
  }
  return selections.filter(Boolean).length > 0
}
