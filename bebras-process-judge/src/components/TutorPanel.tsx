import { useState } from 'react'
import type { Problem, TutorMode } from '../types'
import {
  buildCounterexample,
  buildDebugPrompt,
  buildHint,
  tutorPolicyNote,
  type TutorReply,
} from '../services/tutor'
import { tutorModeLabels } from '../utils/labels'

/**
 * 정답을 주지 않는 도움 패널입니다.
 * 최초 답 제출과 전이 문제 단계에서는 화면에 나타나지 않습니다.
 */
export function TutorPanel({
  problem,
  currentAnswer,
  processAnswers,
  visibleStepCount,
  onUse,
}: {
  problem: Problem
  currentAnswer: string
  processAnswers: Record<string, string[]>
  /** 학생이 지금까지 본 과정 문항 수입니다. */
  visibleStepCount?: number
  onUse: (reply: TutorReply) => void
}) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<TutorReply[]>([])
  const [hintDepth, setHintDepth] = useState(0)
  const [hintExhausted, setHintExhausted] = useState(false)

  function request(mode: TutorMode) {
    let reply: TutorReply
    if (mode === 'hint') {
      const nextDepth = hintDepth + 1
      reply = buildHint(problem, nextDepth)
      setHintDepth(reply.depth)
      if (!reply.hasMore) setHintExhausted(true)
    } else if (mode === 'counterexample') {
      reply = buildCounterexample(problem, currentAnswer)
    } else {
      reply = buildDebugPrompt(problem, processAnswers, visibleStepCount)
    }
    setLog((previous) => [...previous, reply])
    onUse(reply)
  }

  return (
    <section className={`tutor-panel ${open ? 'open' : ''}`}>
      <button type="button" className="tutor-toggle" onClick={() => setOpen((value) => !value)}>
        <span className="tutor-badge">AI</span>
        <span>
          <strong>정답을 알려주지 않는 도움</strong>
          <small>
            {log.length === 0 ? '필요할 때만 열어 보세요' : `${log.length}번 사용했습니다`}
          </small>
        </span>
        <span className="tutor-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="tutor-body">
          <p className="tutor-policy">{tutorPolicyNote}</p>
          <div className="tutor-actions">
            <button
              type="button"
              className="button secondary small-button"
              disabled={hintExhausted}
              onClick={() => request('hint')}
            >
              {hintDepth === 0
                ? tutorModeLabels.hint
                : hintExhausted
                  ? '힌트를 모두 봤습니다'
                  : `${tutorModeLabels.hint} 더 보기 (${hintDepth + 1}단계)`}
            </button>
            <button
              type="button"
              className="button secondary small-button"
              onClick={() => request('counterexample')}
            >
              {tutorModeLabels.counterexample}
            </button>
            <button
              type="button"
              className="button secondary small-button"
              onClick={() => request('debug')}
            >
              {tutorModeLabels.debug}
            </button>
          </div>

          {log.length === 0 ? (
            <p className="muted tutor-empty">
              도움을 받아도 점수가 깎이지 않습니다. 다만 어떤 도움을 언제 썼는지는 기록됩니다.
            </p>
          ) : (
            <ol className="tutor-log">
              {log.map((reply, index) => (
                <li key={`${reply.mode}-${index}`}>
                  <span className="tutor-log-tag">
                    {tutorModeLabels[reply.mode]}
                    {reply.mode === 'hint' ? ` ${reply.depth}단계` : ''}
                  </span>
                  <p>{reply.message}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
