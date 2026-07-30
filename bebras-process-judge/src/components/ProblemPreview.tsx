import type { Problem, ProcessStep } from '../types'
import { ctLabels, dokLabels, processTypeLabels } from '../utils/labels'
import { ProblemVisual } from './ProblemVisual'
import { PathDrawBoard } from './process/PathDrawBoard'
import { PatternMarkBoard } from './process/PatternMarkBoard'
import { NetworkSelectBoard } from './process/NetworkSelectBoard'

export function ProblemPreview({ problem }: { problem: Problem }) {
  return (
    <div className="author-preview">
      <section className="problem-card panel preview-problem-card">
        <div className="problem-heading">
          <div>
            <div className="eyebrow">{problem.category || '분류 미지정'}</div>
            <h1>{problem.title || '제목 없음'}</h1>
          </div>
          <div className="ct-tags">
            {problem.ctElements.map((element) => (
              <span key={element}>{ctLabels[element]}</span>
            ))}
            {problem.dokLevel !== undefined && (
              <span className="dok-chip">{dokLabels[problem.dokLevel]}</span>
            )}
          </div>
        </div>
        <p className="problem-stem">{problem.stem || '문제 설명이 없습니다.'}</p>
        {problem.rules && problem.rules.filter(Boolean).length > 0 && (
          <div className="rules-box">
            {problem.rules.filter(Boolean).map((rule, index) => (
              <div key={`${rule}-${index}`}>
                <span>{index + 1}</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        )}
        <ProblemVisual visual={problem.visual} problem={problem} />
        <div className="preview-choice-list">
          {problem.choices.map((choice) => (
            <div
              key={choice.id}
              className={`preview-choice ${choice.id === problem.correctAnswer ? 'correct' : ''}`}
            >
              <strong>{choice.id}</strong>
              <span>{choice.text}</span>
              {choice.id === problem.correctAnswer && <em>정답</em>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel preview-section">
        <div className="eyebrow">과정평가 문항</div>
        <div className="preview-process-list">
          {problem.processSteps.map((step, index) => (
            <article key={step.id}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.question}</strong>
                <small>
                  {ctLabels[step.ctElement]} · {processTypeLabels[step.type]}
                </small>
                <StepAnswerPreview step={step} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {(problem.hints ?? []).filter(Boolean).length > 0 && (
        <section className="panel preview-section">
          <div className="eyebrow">정답을 주지 않는 힌트</div>
          <ol className="preview-hint-list">
            {(problem.hints ?? []).filter(Boolean).map((hint, index) => (
              <li key={`${hint}-${index}`}>{hint}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="panel preview-section">
        <div className="eyebrow">독립 전이 문제</div>
        <h2>{problem.transfer.stem || '전이 문제 없음'}</h2>
        <div className="preview-choice-list compact">
          {problem.transfer.choices.map((choice) => (
            <div
              key={choice.id}
              className={`preview-choice ${
                choice.id === problem.transfer.correctAnswer ? 'correct' : ''
              }`}
            >
              <strong>{choice.id}</strong>
              <span>{choice.text}</span>
              {choice.id === problem.transfer.correctAnswer && <em>정답</em>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** 유형마다 정답의 모습이 다르므로 각각 알맞게 보여 줍니다. */
function StepAnswerPreview({ step }: { step: ProcessStep }) {
  if (step.type === 'path_draw' && step.path) {
    return (
      <div className="preview-board">
        <PathDrawBoard board={step.path} cells={step.correct} onChange={() => undefined} readOnly />
        <p className="muted">
          기준 경로 {Math.max(0, step.correct.length - 1)}번 이동. 같은 길이의 다른 최단 경로도
          정답입니다.
        </p>
      </div>
    )
  }

  if (step.type === 'state_trace' && step.states) {
    return (
      <ul className="preview-stage-list">
        {step.states.stages.map((stage) => (
          <li key={stage.id}>
            <b>{stage.label}</b>
            <span>
              {stage.options.find((option) => option.id === stage.correctId)?.text ?? '정답 미지정'}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (step.type === 'pattern_mark' && step.pattern) {
    return (
      <div className="preview-board">
        <PatternMarkBoard
          board={step.pattern}
          selections={step.correct}
          onChange={() => undefined}
          readOnly
        />
        <p className="muted">반복 단위 {step.pattern.unitLength}칸</p>
      </div>
    )
  }

  if (step.type === 'network_select' && step.network) {
    return (
      <div className="preview-board">
        <NetworkSelectBoard
          board={step.network}
          selections={step.correct}
          onChange={() => undefined}
          readOnly
        />
      </div>
    )
  }

  if (step.type === 'step_order') {
    return <p>{step.items.map((item) => item.text).join(' → ')}</p>
  }

  return (
    <p>
      {step.items
        .filter((item) => step.correct.includes(item.id))
        .map((item) => item.text)
        .join(', ') || '정답 미지정'}
    </p>
  )
}
