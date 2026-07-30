import type { Attempt, Problem, ProcessStep, ProcessStepResponse } from '../types'
import {
  buildAiUsage,
  buildCalibration,
  buildCtProfile,
  buildQuadrant,
  buildRevisionQuality,
  summarizeAttempt,
} from '../judge/judge'
import { confidenceLabels, processTypeLabels, revisionReasonLabels, tutorModeLabels } from '../utils/labels'

export function ResultProfile({ attempt, problems }: { attempt: Attempt; problems: Problem[] }) {
  const summary = summarizeAttempt(attempt)
  const profile = buildCtProfile(attempt, problems)
  const calibration = buildCalibration(attempt)
  const quadrant = buildQuadrant(attempt)
  const revision = buildRevisionQuality(attempt)
  const aiUsage = buildAiUsage(attempt)

  return (
    <div className="result-grid">
      <section className="panel summary-panel">
        <div className="eyebrow">평가 결과</div>
        <h2>{attempt.nickname}의 사고과정 프로파일</h2>
        <p className="muted">
          정답만이 아니라 독립 풀이, 과정 증거, 최종 판단, 전이 수행을 나누어 보여 줍니다.
        </p>
        <div className="metric-grid">
          <Metric label="독립 정답률" value={summary.initialPercent} note="첫 답 기준" />
          <Metric label="과정 수행률" value={summary.processPercent} note="핵심 증거" />
          <Metric label="최종 정답률" value={summary.finalPercent} note="검토 후" />
          <Metric label="전이 정답률" value={summary.transferPercent} note="새 맥락" />
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">컴퓨팅 사고 6요소</div>
        <div className="profile-bars">
          {profile.map((item) => (
            <div className="profile-row" key={item.element}>
              <div className="profile-label">
                <span>{item.label}</span>
                <strong>{item.total === 0 ? '측정 없음' : `${item.percent}%`}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.percent}%` }} />
              </div>
              {item.total > 0 && (
                <small className="profile-count">
                  {item.earned}/{item.total}점
                </small>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel full-span insight-panel">
        <div className="eyebrow">결과와 과정의 교차 해석</div>
        <h2>같은 정답이라도 과정이 다르면 다르게 봅니다.</h2>
        <div className="insight-grid">
          <InsightCard
            tone="good"
            label="전략적 해결"
            value={quadrant.strategic}
            note="정답이고 과정 증거도 충분합니다."
          />
          <InsightCard
            tone="warn"
            label="추측 의심"
            value={quadrant.likelyGuess}
            note="정답이지만 과정 증거가 약합니다."
          />
          <InsightCard
            tone="info"
            label="실수 가능"
            value={quadrant.slipped}
            note="과정은 좋은데 최종 답이 틀렸습니다."
          />
          <InsightCard
            tone="bad"
            label="개념 보완 필요"
            value={quadrant.developing}
            note="결과와 과정 모두 보완이 필요합니다."
          />
        </div>

        <div className="insight-columns">
          <div className="insight-block">
            <h3>확신도 보정</h3>
            <p className="muted">
              확신도와 실제 결과가 얼마나 맞는지 봅니다. 확신 표시가 ‘조금 확실함’인 문항은 셈에서
              뺍니다.
            </p>
            {calibration.measured === 0 ? (
              <p className="muted">
                ‘{confidenceLabels.high}’ 또는 ‘{confidenceLabels.low}’로 표시한 문항이 없습니다.
              </p>
            ) : (
              <ul className="insight-list">
                <li>
                  <span>일치</span>
                  <strong>
                    {calibration.aligned}문항 · {calibration.percent}%
                  </strong>
                </li>
                <li className={calibration.overconfident > 0 ? 'warn' : ''}>
                  <span>과신 (확실하다 했지만 틀림)</span>
                  <strong>{calibration.overconfident}문항</strong>
                </li>
                <li className={calibration.underconfident > 0 ? 'info' : ''}>
                  <span>과소 확신 (모른다 했지만 맞음)</span>
                  <strong>{calibration.underconfident}문항</strong>
                </li>
              </ul>
            )}
          </div>

          <div className="insight-block">
            <h3>수정의 질</h3>
            <p className="muted">과정을 확인한 뒤 답이 좋아졌는지 나빠졌는지 봅니다.</p>
            <ul className="insight-list">
              <li className={revision.improved > 0 ? 'good' : ''}>
                <span>오답 → 정답</span>
                <strong>{revision.improved}문항</strong>
              </li>
              <li className={revision.damaged > 0 ? 'warn' : ''}>
                <span>정답 → 오답</span>
                <strong>{revision.damaged}문항</strong>
              </li>
              <li>
                <span>정답 유지</span>
                <strong>{revision.keptCorrect}문항</strong>
              </li>
              <li>
                <span>오답 유지</span>
                <strong>{revision.keptWrong}문항</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel full-span ai-usage-panel">
        <div className="ai-usage-head">
          <div>
            <div className="eyebrow">AI 활용 역량 (컴퓨팅 사고 점수와 분리)</div>
            <h2>도움을 언제, 어떻게 썼는지 따로 봅니다.</h2>
            <p className="muted">
              이 값은 컴퓨팅 사고 점수에 더해지거나 깎이지 않습니다. 최초 답과 전이 문제에서는 도움을
              사용할 수 없습니다.
            </p>
          </div>
          <div className="ai-usage-total">
            <strong>{aiUsage.total}</strong>
            <span>번 사용</span>
          </div>
        </div>
        <div className="metric-grid">
          <PlainMetric label="도움 없이 푼 문제" value={`${aiUsage.independentProblems}개`} />
          <PlainMetric label="도움을 쓴 문제" value={`${aiUsage.problemsWithHelp}개`} />
          <PlainMetric label="가장 깊은 힌트 단계" value={`${aiUsage.maxDepth}단계`} />
          <PlainMetric label="도움 뒤 답을 고친 문제" value={`${aiUsage.revisedAfterHelp}개`} />
        </div>
        <div className="ai-mode-row">
          {(Object.keys(tutorModeLabels) as Array<keyof typeof tutorModeLabels>).map((mode) => (
            <span key={mode} className="ai-mode-chip">
              {tutorModeLabels[mode]} <strong>{aiUsage.byMode[mode] ?? 0}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="panel full-span">
        <div className="eyebrow">문제별 근거</div>
        <div className="response-table-wrap">
          <table className="response-table">
            <thead>
              <tr>
                <th>문제</th>
                <th>첫 답</th>
                <th>확신도</th>
                <th>과정</th>
                <th>최종</th>
                <th>전이</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {attempt.responses.map((response) => {
                const problem = problems.find((item) => item.id === response.problemId)
                return (
                  <tr key={response.problemId}>
                    <td>
                      <strong>{problem?.title ?? response.problemId}</strong>
                    </td>
                    <td>
                      <AnswerStatus answer={response.initialAnswer} ok={response.initialCorrect} />
                    </td>
                    <td>{confidenceLabels[response.confidence] ?? '-'}</td>
                    <td>
                      {response.processCorrectCount}/{response.processTotal}
                    </td>
                    <td>
                      <AnswerStatus answer={response.finalAnswer} ok={response.finalCorrect} />
                    </td>
                    <td>
                      <AnswerStatus answer={response.transferAnswer} ok={response.transferCorrect} />
                    </td>
                    <td>{response.tutorUseCount ?? 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel full-span evidence-panel">
        <div className="eyebrow">과정 증거 상세</div>
        <h2>학생이 실제로 남긴 판단 흔적</h2>
        <div className="evidence-list">
          {attempt.responses.map((response, responseIndex) => {
            const problem = problems.find((item) => item.id === response.problemId)
            if (!problem) return null
            return (
              <details key={response.problemId} className="evidence-item" open={responseIndex === 0}>
                <summary>
                  <span>
                    <strong>{problem.title}</strong>
                    <small>{problem.category}</small>
                  </span>
                  <span className="evidence-score">
                    과정 {response.processCorrectCount}/{response.processTotal}
                  </span>
                </summary>
                <div className="evidence-content">
                  <div className="answer-history">
                    <div>
                      <span>첫 답</span>
                      <strong>{response.initialAnswer}</strong>
                    </div>
                    <div>
                      <span>최종 답</span>
                      <strong>{response.finalAnswer}</strong>
                    </div>
                    <div>
                      <span>수정 이유</span>
                      <strong>{revisionReasonLabels[response.revisionReason]}</strong>
                    </div>
                  </div>
                  <div className="step-evidence-grid">
                    {response.processResponses.map((stepResponse) => {
                      const step = problem.processSteps.find(
                        (candidate) => candidate.id === stepResponse.stepId,
                      )
                      if (!step) return null
                      return <ProcessEvidence key={step.id} step={step} response={stepResponse} />
                    })}
                  </div>
                  {(attempt.tutorUses ?? []).filter((use) => use.problemId === problem.id).length >
                    0 && (
                    <div className="evidence-ai-log">
                      <strong>이 문제에서 받은 도움</strong>
                      <ul>
                        {(attempt.tutorUses ?? [])
                          .filter((use) => use.problemId === problem.id)
                          .map((use) => (
                            <li key={use.id}>
                              <span className="tutor-log-tag">
                                {tutorModeLabels[use.mode]}
                                {use.mode === 'hint' ? ` ${use.depth}단계` : ''}
                              </span>
                              {use.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ProcessEvidence({
  step,
  response,
}: {
  step: ProcessStep
  response: ProcessStepResponse
}) {
  return (
    <article className="step-evidence-card">
      <div className="step-evidence-heading">
        <strong>{step.question}</strong>
        <span className={`status-pill ${response.exact ? 'ok' : 'no'}`}>
          {response.earned}/{response.total}
        </span>
      </div>
      <small className="step-evidence-type">{processTypeLabels[step.type]}</small>
      <p>{describeSelections(step, response)}</p>
      {response.criteria && response.criteria.length > 0 && (
        <ul className="criteria-list">
          {response.criteria.map((item, index) => (
            <li key={`${item.label}-${index}`} className={item.passed ? 'passed' : 'failed'}>
              <span>{item.passed ? '✓' : '×'}</span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/** 저장된 선택값을 사람이 읽을 수 있는 문장으로 바꿉니다. */
function describeSelections(step: ProcessStep, response: ProcessStepResponse) {
  if (step.type === 'path_draw') {
    return response.selections.length === 0
      ? '경로를 그리지 않았습니다.'
      : `${response.selections.join(' → ')} (${Math.max(0, response.selections.length - 1)}번 이동)`
  }

  if (step.type === 'state_trace') {
    const stages = step.states?.stages ?? []
    return (
      stages
        .map((stage, index) => {
          const picked = stage.options.find((option) => option.id === response.selections[index])
          return `${stage.label}: ${picked?.text ?? '미선택'}`
        })
        .join(' / ') || '기록 없음'
    )
  }

  if (step.type === 'pattern_mark') {
    const tokens = step.pattern?.tokens ?? []
    const marked = response.selections
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value < tokens.length)
      .sort((a, b) => a - b)
    return marked.length === 0
      ? '표시하지 않았습니다.'
      : `${marked.map((index) => tokens[index]).join(' ')} (${marked.length}칸)`
  }

  if (step.type === 'network_select') {
    return response.selections.length === 0 ? '선택하지 않았습니다.' : response.selections.join(', ')
  }

  const texts = response.selections
    .map((id) => step.items.find((item) => item.id === id)?.text)
    .filter((text): text is string => Boolean(text))

  if (texts.length === 0) return '기록 없음'
  return step.type === 'step_order' ? texts.join(' → ') : texts.join(', ')
}

function InsightCard({
  tone,
  label,
  value,
  note,
}: {
  tone: 'good' | 'warn' | 'info' | 'bad'
  label: string
  value: number
  note: string
}) {
  return (
    <div className={`insight-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}문항</strong>
      <small>{note}</small>
    </div>
  )
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}%</strong>
      <small>{note}</small>
    </div>
  )
}

function PlainMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AnswerStatus({ answer, ok }: { answer: string; ok: boolean }) {
  return <span className={`status-pill ${ok ? 'ok' : 'no'}`}>{answer} · {ok ? '성공' : '보완'}</span>
}
