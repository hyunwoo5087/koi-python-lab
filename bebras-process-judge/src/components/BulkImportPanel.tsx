import { useState, type ChangeEvent } from 'react'
import type { Problem, ProblemCatalog } from '../types'
import {
  downloadProblemPack,
  importTemplate,
  parseProblemPack,
  type ImportResult,
} from '../services/problemPack'
import { saveCustomProblems } from '../services/problemCatalog'
import { reviewProblem } from '../services/validity'
import { processTypeLabels } from '../utils/labels'
import { starterPack } from '../data/starterPack'

/** 교사가 실제 비버 문제를 한 번에 등록하고 되돌려 받을 수 있게 합니다. */
export function BulkImportPanel({
  catalog,
  onCatalogChanged,
}: {
  catalog: ProblemCatalog
  onCatalogChanged: () => void
}) {
  const [rawText, setRawText] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [publishOnImport, setPublishOnImport] = useState(false)
  const [message, setMessage] = useState('')

  function analyze(text: string) {
    setRawText(text)
    setMessage('')
    setResult(text.trim() ? parseProblemPack(text) : null)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      analyze(await file.text())
    } catch {
      setMessage('파일을 읽지 못했습니다. UTF-8 JSON 파일인지 확인해 주세요.')
    } finally {
      event.target.value = ''
    }
  }

  function commit() {
    if (!result || result.problems.length === 0) return
    try {
      saveCustomProblems(
        result.problems.map((problem) => ({ ...problem, isActive: publishOnImport })),
      )
      setMessage(
        `${result.problems.length}개 문제를 ${publishOnImport ? '공개 상태로' : '비공개로'} 등록했습니다.`,
      )
      setRawText('')
      setResult(null)
      onCatalogChanged()
    } catch {
      setMessage(
        '문제를 저장하지 못했습니다. 업로드한 그림이 큰 경우 브라우저 저장 공간이 부족할 수 있습니다.',
      )
    }
  }

  function loadStarterPack() {
    analyze(JSON.stringify({ problems: starterPack }, null, 2))
  }

  return (
    <div className="bulk-import">
      <section className="panel bulk-hero">
        <div>
          <div className="eyebrow">문제 일괄 등록</div>
          <h2>준비한 비버 문제를 한 번에 올립니다.</h2>
          <p>
            JSON 파일을 올리거나 내용을 붙여 넣으면 문제마다 검사한 뒤 등록합니다. 형식이 어긋난
            문제는 건너뛰고 이유를 알려 줍니다.
          </p>
        </div>
        <div className="button-row wrap">
          <label className="button primary upload-button">
            JSON 파일 선택
            <input type="file" accept="application/json,.json" onChange={handleFile} />
          </label>
          <button className="button secondary" onClick={loadStarterPack}>
            예시 묶음 불러오기
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="bulk-toolbar">
          <div>
            <div className="eyebrow">직접 붙여 넣기</div>
            <h3>문제 JSON</h3>
          </div>
          <div className="button-row wrap">
            <button className="button ghost small-button" onClick={() => analyze(importTemplate)}>
              서식 채우기
            </button>
            <button
              className="button ghost small-button"
              disabled={catalog.allProblems.length === 0}
              onClick={() =>
                downloadProblemPack(
                  catalog.allProblems,
                  `비버문제_전체_${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              전체 문제 내보내기
            </button>
            <button
              className="button ghost small-button"
              disabled={catalog.customProblems.length === 0}
              onClick={() =>
                downloadProblemPack(
                  catalog.customProblems,
                  `비버문제_직접제작_${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              직접 만든 문제만 내보내기
            </button>
          </div>
        </div>
        <textarea
          className="bulk-textarea"
          rows={12}
          spellCheck={false}
          value={rawText}
          placeholder='{ "problems": [ ... ] } 형태로 붙여 넣으세요.'
          onChange={(event) => analyze(event.target.value)}
        />
        {message && <div className="server-message">{message}</div>}
      </section>

      {result && (
        <section className="panel">
          <div className="bulk-summary-row">
            <SummaryPill label="등록 가능" value={result.problems.length} tone="good" />
            <SummaryPill label="건너뜀" value={result.skipped} tone={result.skipped > 0 ? 'warn' : 'plain'} />
            <SummaryPill
              label="확인 필요 메시지"
              value={result.issues.reduce((sum, issue) => sum + issue.messages.length, 0)}
              tone={result.issues.length > 0 ? 'warn' : 'plain'}
            />
          </div>

          {result.issues.length > 0 && (
            <div className="bulk-issue-list">
              {result.issues.map((issue) => (
                <div key={`${issue.index}-${issue.title}`}>
                  <strong>
                    {issue.index}. {issue.title}
                  </strong>
                  <ul>
                    {issue.messages.map((text, index) => (
                      <li key={`${text}-${index}`}>{text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {result.problems.length > 0 && (
            <>
              <div className="bulk-preview-list">
                {result.problems.map((problem) => (
                  <ImportRow key={problem.id} problem={problem} />
                ))}
              </div>
              <div className="bulk-commit-row">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={publishOnImport}
                    onChange={(event) => setPublishOnImport(event.target.checked)}
                  />
                  <span className="switch-control" />
                  <strong>{publishOnImport ? '등록하면서 학생에게 공개' : '비공개로 등록'}</strong>
                </label>
                <button className="button primary" onClick={commit}>
                  {result.problems.length}개 문제 등록
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

function ImportRow({ problem }: { problem: Problem }) {
  const review = reviewProblem(problem)
  return (
    <article className="bulk-preview-row">
      <div>
        <div className="problem-title-line">
          <strong>{problem.title}</strong>
          <span className="origin-chip custom">{problem.category}</span>
        </div>
        <p>
          과정 {problem.processSteps.length}단계 ·{' '}
          {problem.processSteps.map((step) => processTypeLabels[step.type]).join(', ')}
        </p>
      </div>
      <span
        className={`review-score ${review.score >= 80 ? 'ok' : review.score >= 60 ? 'warn' : 'bad'}`}
      >
        {review.score}점
      </span>
    </article>
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'good' | 'warn' | 'plain'
}) {
  return (
    <div className={`summary-pill tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
