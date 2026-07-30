import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import type { ProblemCatalog } from '../types'
import {
  getStoredSession,
  signInWithPassword,
  signOut as serverSignOut,
  signUp,
  subscribeToAuthChanges,
  supabaseConfigured,
  type ServerSession,
} from '../services/supabaseClient'
import {
  checkBackendStatus,
  deletePublishedSet,
  listMyPublishedSets,
  listMyServerAttempts,
  publishProblemSet,
  setPublishedSetActive,
  type BackendStatus,
  type PublishedSet,
  type ServerAttemptRecord,
} from '../services/serverRepository'
import { summarizeAttempt } from '../judge/judge'
import { ConnectionDoctor } from './ConnectionDoctor'

export function ServerPanel({ catalog }: { catalog: ProblemCatalog }) {
  const [session, setSession] = useState<ServerSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(supabaseConfigured)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('DEMO-6A')
  const [title, setTitle] = useState('비버 사고과정 과제')
  const [sets, setSets] = useState<PublishedSet[]>([])
  const [attempts, setAttempts] = useState<ServerAttemptRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabaseConfigured) return
    let mounted = true

    const sessionTask = getStoredSession()
      .then((storedSession) => {
        if (mounted) setSession(storedSession)
      })
      .catch((error) => {
        if (mounted) setMessage(`교사 세션 확인 실패: ${readError(error)}`)
      })

    const backendTask = checkBackendStatus()
      .then((status) => {
        if (mounted) setBackendStatus(status)
      })
      .catch((error) => {
        if (mounted) setMessage(`Supabase 연결 확인 실패: ${readError(error)}`)
      })

    void Promise.allSettled([sessionTask, backendTask]).finally(() => {
      if (mounted) setSessionLoading(false)
    })

    const unsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setSets([])
      setAttempts([])
      return
    }
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  const groupedAttempts = useMemo(() => {
    return sets.map((set) => ({
      set,
      attempts: attempts.filter((item) => item.publishedSetId === set.id),
    }))
  }, [attempts, sets])

  if (!supabaseConfigured) {
    return (
      <div className="server-panel">
      <section className="panel server-empty-panel">
        <div className="server-status-icon">☁</div>
        <div>
          <div className="eyebrow">서버 배포 준비</div>
          <h2>Supabase 환경 변수가 아직 설정되지 않았습니다.</h2>
          <p>
            프로젝트 폴더에서 <code>npm run setup:supabase</code>를 실행하면 <code>.env.local</code>을 만들고
            연결까지 확인합니다. Windows에서는 <code>setup-supabase-easy.cmd</code>를 두 번 눌러도 됩니다.
            설정을 마친 뒤에는 개발 서버를 껐다가 다시 켜야 값이 반영됩니다.
          </p>
          <pre className="env-example">VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co{"\n"}VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...</pre>
          <p className="muted">브라우저에는 Publishable key만 사용하며 Secret key와 service_role 키는 입력하지 않습니다.</p>
        </div>
      </section>
      <ConnectionDoctor />
      </div>
    )
  }

  if (sessionLoading) {
    return (
      <section className="panel server-empty-panel">
        <div className="server-status-icon connected">↻</div>
        <div><div className="eyebrow">Supabase 연결 확인</div><h2>교사 세션과 데이터베이스를 확인하고 있습니다.</h2></div>
      </section>
    )
  }

  if (!session) {
    return (
      <div className="server-auth-layout">
        <section className="panel server-auth-card">
          <div className={`server-status-icon ${backendStatus ? 'connected' : ''}`}>{backendStatus ? '✓' : '!'}</div>
          <div className="eyebrow">{backendStatus ? `Supabase 스키마 ${backendStatus.schemaVersion}` : 'Supabase 점검 필요'}</div>
          <h2>교사 계정으로 로그인하세요.</h2>
          <p className="muted">교사가 공개한 과제와 학생 제출 기록은 로그인 계정별로 분리됩니다.</p>
          <label className="field-label">이메일<input type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} placeholder="teacher@example.com" /></label>
          <label className="field-label">비밀번호<input type="password" value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} placeholder="6자 이상" /></label>
          {message && <div className="server-message">{message}</div>}
          <div className="button-row wrap">
            <button className="button primary" disabled={busy || !email || password.length < 6 || !backendStatus} onClick={() => authenticate('signin')}>로그인</button>
            <button className="button secondary" disabled={busy || !email || password.length < 6 || !backendStatus} onClick={() => authenticate('signup')}>교사 계정 만들기</button>
            {!backendStatus && <button className="button ghost" disabled={busy} onClick={recheckBackend}>연결 다시 확인</button>}
          </div>
        </section>
        <section className="panel server-guide-card">
          <div className="eyebrow">서버 모드에서 가능한 일</div>
          <h2>다른 기기와 학급에서 같은 과제를 사용합니다.</h2>
          <ol>
            <li>현재 공개 문제를 과제 코드로 서버에 게시합니다.</li>
            <li>학생은 같은 사이트에서 과제 코드를 입력해 문제를 불러옵니다.</li>
            <li>학생의 완료 기록이 교사 계정 대시보드에 모입니다.</li>
          </ol>
        </section>
        <div className="server-auth-doctor">
          <ConnectionDoctor />
        </div>
      </div>
    )
  }

  return (
    <div className="server-panel">
      <section className="panel server-publish-card">
        <div className="server-panel-heading">
          <div>
            <div className="eyebrow">서버 과제 게시 · 스키마 {backendStatus?.schemaVersion ?? '확인 중'}</div>
            <h2>현재 공개 문제 {catalog.activeProblems.length}개를 학생에게 배포합니다.</h2>
            <p>같은 교사가 같은 과제 코드를 다시 게시하면 최신 문제 구성으로 갱신됩니다. 이미 제출된 기록은 보존됩니다.</p>
          </div>
          <div className="signed-user"><span>교사 로그인</span><strong>{session.user.email ?? '교사 계정'}</strong><button className="text-button" onClick={handleSignOut}>로그아웃</button></div>
        </div>
        <div className="publish-form-grid">
          <label className="field-label">과제 코드<input value={accessCode} maxLength={24} onChange={(event: ChangeEvent<HTMLInputElement>) => setAccessCode(normalizeCodeInput(event.target.value))} placeholder="예: DEOKGYE-6A" /></label>
          <label className="field-label">과제 이름<input value={title} maxLength={60} onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)} /></label>
        </div>
        {message && <div className="server-message">{message}</div>}
        <div className="button-row wrap">
          <button className="button primary" disabled={busy || accessCode.length < 4 || catalog.activeProblems.length === 0} onClick={publish}>현재 공개 문제 서버에 게시</button>
          <button className="button secondary" disabled={busy} onClick={() => refresh()}>서버 기록 새로고침</button>
        </div>
      </section>

      <section className="server-summary-grid">
        <ServerMetric label="게시 과제" value={`${sets.length}개`} />
        <ServerMetric label="서버 제출" value={`${attempts.length}건`} />
        <ServerMetric label="현재 공개 문제" value={`${catalog.activeProblems.length}개`} />
      </section>

      {groupedAttempts.length === 0 ? (
        <section className="panel empty-state compact-empty"><h3>아직 서버에 게시한 과제가 없습니다.</h3><p>과제 코드와 이름을 정한 뒤 현재 공개 문제를 게시하세요.</p></section>
      ) : (
        <div className="published-set-list">
          {groupedAttempts.map(({ set, attempts: setAttempts }) => (
            <section className="panel published-set-card" key={set.id}>
              <div className="published-set-header">
                <div>
                  <div className="problem-title-line"><strong>{set.title}</strong><span className={`visibility-chip ${set.isActive ? 'active' : ''}`}>{set.isActive ? '학생 접속 가능' : '접속 중지'}</span></div>
                  <p>과제 코드 <b>{set.accessCode}</b> · 문제 {set.problems.length}개 · 제출 {setAttempts.length}건</p>
                </div>
                <div className="button-row wrap">
                  <button className="button ghost small-button" onClick={() => copyCode(set.accessCode)}>코드 복사</button>
                  <button className="button secondary small-button" onClick={() => toggleSet(set)}>{set.isActive ? '접속 중지' : '다시 공개'}</button>
                  <button className="button ghost small-button danger-text" onClick={() => removeSet(set)}>삭제</button>
                </div>
              </div>
              {setAttempts.length === 0 ? (
                <div className="server-no-attempts">아직 제출된 학생 기록이 없습니다.</div>
              ) : (
                <div className="server-attempt-table-wrap">
                  <table className="server-attempt-table">
                    <thead><tr><th>학생</th><th>학급 코드</th><th>독립</th><th>과정</th><th>최종</th><th>전이</th><th>완료 시각</th></tr></thead>
                    <tbody>
                      {setAttempts.map((item) => {
                        const summary = summarizeAttempt(item.attempt)
                        return <tr key={item.id}><td>{item.nickname}</td><td>{item.classCode}</td><td>{summary.initialPercent}%</td><td>{summary.processPercent}%</td><td>{summary.finalPercent}%</td><td>{summary.transferPercent}%</td><td>{formatDate(item.completedAt)}</td></tr>
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <ConnectionDoctor />
    </div>
  )

  async function authenticate(mode: 'signin' | 'signup') {
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signin') {
        const nextSession = await signInWithPassword(email.trim(), password)
        setSession(nextSession)
        setMessage('로그인되었습니다.')
      } else {
        const result = await signUp(email.trim(), password)
        if (result.session) {
          setSession(result.session)
          setMessage('교사 계정을 만들고 로그인했습니다.')
        } else {
          setMessage('교사 계정을 만들었습니다. 인증 메일을 확인한 뒤 로그인하세요.')
        }
      }
    } catch (error) {
      setMessage(readError(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    try {
      await serverSignOut()
    } catch (error) {
      setMessage(readError(error))
    } finally {
      setSession(null)
      setMessage('')
    }
  }

  async function publish() {
    setBusy(true)
    setMessage('')
    try {
      await publishProblemSet({ accessCode, title, problems: catalog.activeProblems })
      // 목록을 새로 읽은 뒤에 안내 문구를 남겨야 지워지지 않습니다.
      await refresh({ keepMessage: true })
      setMessage(
        `과제 코드 ${accessCode}로 게시했습니다. 학생에게 이 코드를 알려 주세요. 게시한 문제 ${catalog.activeProblems.length}개.`,
      )
    } catch (error) {
      setMessage(readError(error))
    } finally {
      setBusy(false)
    }
  }

  async function refresh({ keepMessage = false }: { keepMessage?: boolean } = {}) {
    setBusy(true)
    if (!keepMessage) setMessage('')
    try {
      const [nextSets, nextAttempts] = await Promise.all([listMyPublishedSets(), listMyServerAttempts()])
      setSets(nextSets)
      setAttempts(nextAttempts)
    } catch (error) {
      setMessage(readError(error))
      if (/jwt|token|unauthorized|로그인/i.test(readError(error))) {
        await serverSignOut().catch(() => undefined)
        setSession(null)
      }
    } finally {
      setBusy(false)
    }
  }

  async function recheckBackend() {
    setBusy(true)
    setMessage('')
    try {
      const [status, storedSession] = await Promise.all([checkBackendStatus(), getStoredSession()])
      setBackendStatus(status)
      setSession(storedSession)
      setMessage(`Supabase 스키마 ${status.schemaVersion} 연결을 확인했습니다.`)
    } catch (error) {
      setMessage(`연결 실패: ${readError(error)} 아래 연결 진단에서 막힌 단계를 확인하세요.`)
    } finally {
      setBusy(false)
    }
  }

  async function toggleSet(set: PublishedSet) {
    try {
      await setPublishedSetActive(set.id, !set.isActive)
      await refresh()
    } catch (error) {
      setMessage(readError(error))
    }
  }

  async function removeSet(set: PublishedSet) {
    if (!window.confirm(`“${set.title}” 서버 과제와 연결된 제출 기록을 모두 삭제할까요?`)) return
    try {
      await deletePublishedSet(set.id)
      await refresh()
    } catch (error) {
      setMessage(readError(error))
    }
  }
}

function ServerMetric({ label, value }: { label: string; value: string }) {
  return <div className="metric-card dashboard-metric"><span>{label}</span><strong>{value}</strong></div>
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : '서버 작업 중 오류가 발생했습니다.'
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR')
}

function normalizeCodeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    window.alert(`과제 코드 ${code}를 복사했습니다.`)
  } catch {
    window.prompt('과제 코드를 복사하세요.', code)
  }
}
