import { useEffect, useState } from 'react'
import { runDiagnostics, type DiagnosticsResult } from '../services/diagnostics'

const statusIcon = { ok: '✓', warn: '!', fail: '×', skip: '·' } as const
const statusText = { ok: '정상', warn: '확인 권장', fail: '해결 필요', skip: '건너뜀' } as const

/** Supabase 연결을 앱 안에서 단계별로 점검합니다. */
export function ConnectionDoctor({ autoRun = true }: { autoRun?: boolean }) {
  const [result, setResult] = useState<DiagnosticsResult | null>(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      setResult(await runDiagnostics())
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (autoRun) void run()
    // 처음 열릴 때 한 번만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const failCount = result?.checks.filter((check) => check.status === 'fail').length ?? 0

  return (
    <section className="panel doctor-panel">
      <div className="doctor-head">
        <div>
          <div className="eyebrow">연결 진단</div>
          <h3>
            {!result
              ? '점검을 준비합니다.'
              : result.ok
                ? '서버 연결에 문제가 없습니다.'
                : `${failCount}단계에서 막혀 있습니다.`}
          </h3>
          {result && (
            <p className="muted">
              {new Date(result.ranAt).toLocaleTimeString('ko-KR')} 기준 · 위에서부터 순서대로 해결하면
              됩니다.
            </p>
          )}
        </div>
        <button className="button secondary small-button" disabled={busy} onClick={run}>
          {busy ? '점검 중…' : '다시 점검'}
        </button>
      </div>

      {result && (
        <ol className="doctor-list">
          {result.checks.map((check) => (
            <li key={check.id} className={`doctor-item status-${check.status}`}>
              <span className="doctor-status" aria-label={statusText[check.status]}>
                {statusIcon[check.status]}
              </span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
                {check.fix && <p className="doctor-fix">→ {check.fix}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
