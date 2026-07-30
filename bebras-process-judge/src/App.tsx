import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import { problems as builtInProblems } from './data/problems'
import { StudentRunner } from './components/StudentRunner'
import { TeacherDashboard } from './components/TeacherDashboard'
import { getProblemCatalog } from './services/problemCatalog'
import { isServerAvailable, loadPublishedSet, submitAttemptToServer } from './services/serverRepository'
import type { Attempt, Problem } from './types'

type View = 'home' | 'student-setup' | 'student' | 'teacher'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [nickname, setNickname] = useState('')
  const [classCode, setClassCode] = useState('DEMO-6A')
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [studentProblems, setStudentProblems] = useState<Problem[]>([])
  const [serverAccessCode, setServerAccessCode] = useState<string | null>(null)
  const [setupMessage, setSetupMessage] = useState('')
  const [setupBusy, setSetupBusy] = useState(false)
  const catalog = useMemo(() => getProblemCatalog(builtInProblems), [catalogRevision])
  const serverAvailable = isServerAvailable()

  if (view === 'student') {
    return (
      <StudentRunner
        problems={studentProblems.length > 0 ? studentProblems : catalog.activeProblems}
        nickname={nickname.trim() || '학생'}
        classCode={classCode.trim() || 'DEMO-6A'}
        onBack={() => setView('home')}
        onOpenDashboard={() => setView('teacher')}
        onAttemptCompleted={serverAccessCode ? (attempt) => saveServerAttempt(serverAccessCode, attempt) : undefined}
        serverMode={Boolean(serverAccessCode)}
      />
    )
  }

  if (view === 'teacher') {
    return (
      <TeacherDashboard
        catalog={catalog}
        onCatalogChanged={() => setCatalogRevision((value) => value + 1)}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'student-setup') {
    return (
      <main className="landing-page setup-page">
        <section className="setup-card panel">
          <button className="text-button" onClick={() => setView('home')}>← 돌아가기</button>
          <div className="brand-mark large">B</div>
          <div className="eyebrow">학생 입장</div>
          <h1>과정평가를 시작합니다.</h1>
          <p className="muted">실명 대신 수업에서 사용할 이름이나 번호를 입력하세요.</p>
          <label className="field-label">표시 이름<input value={nickname} maxLength={20} placeholder="예: 6학년 1번" onChange={(event: ChangeEvent<HTMLInputElement>) => setNickname(event.target.value)} /></label>
          <label className="field-label">{serverAvailable ? '교사가 안내한 과제 코드' : '학급 코드'}<input value={classCode} maxLength={24} placeholder="예: DEOKGYE-6A" onChange={(event: ChangeEvent<HTMLInputElement>) => setClassCode(event.target.value.toUpperCase().replace(/\s+/g, '-'))} /></label>
          <div className="privacy-note"><span>✓</span><p>{serverAvailable ? '서버 과제는 교사가 게시한 문제를 불러오며 완료 기록을 Supabase에 제출합니다. 같은 기록은 이 브라우저에도 보관됩니다.' : '현재는 입력한 이름과 풀이 기록, 교사가 만든 문제를 이 브라우저의 localStorage에 저장합니다.'}</p></div>
          {setupMessage && <div className="validation-box"><strong>{setupMessage}</strong></div>}
          {!serverAvailable && catalog.activeProblems.length === 0 && <div className="validation-box"><strong>학생에게 공개된 문제가 없습니다.</strong><p>교사 화면의 문제 제작·관리 메뉴에서 문제를 공개해 주세요.</p></div>}
          {serverAvailable ? (
            <div className="student-start-actions">
              <button className="button primary wide" disabled={setupBusy || !nickname.trim() || !classCode.trim()} onClick={startServerAssignment}>{setupBusy ? '과제를 불러오는 중…' : '과제 코드로 시작'}</button>
              <button className="button secondary wide" disabled={!nickname.trim() || catalog.activeProblems.length === 0} onClick={startLocalAssignment}>이 브라우저 공개 문제로 체험</button>
            </div>
          ) : (
            <button className="button primary wide" disabled={!nickname.trim() || !classCode.trim() || catalog.activeProblems.length === 0} onClick={startLocalAssignment}>{catalog.activeProblems.length}개 문제 시작</button>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="landing-page">
      <header className="top-nav">
        <div className="brand"><span className="brand-mark">B</span><span><strong>비버 사고과정 저지</strong><small>Computational Thinking Process Judge</small></span></div>
        <button className="button ghost" onClick={() => setView('teacher')}>교사 대시보드</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">정답을 넘어, 사고의 흔적까지</div>
          <h1>비버 문제를<br /><em>과정 중심 평가</em>로 바꿉니다.</h1>
          <p>학생의 첫 답, 핵심 과정 증거, 최종 판단, 새로운 문제로의 전이를 분리해 기록하고 교사가 직접 문제를 제작·배포하는 온라인 저지입니다.</p>
          <div className="button-row hero-buttons">
            <button className="button primary large" onClick={() => setView('student-setup')}>학생 평가 시작</button>
            <button className="button secondary large" onClick={() => setView('teacher')}>교사 화면 보기</button>
          </div>
          <div className="hero-facts">
            <span><strong>{catalog.activeProblems.length}</strong> 로컬 공개 문제</span>
            <span><strong>3</strong> 제작 가능 과정 유형</span>
            <span><strong>{serverAvailable ? 'ON' : 'OFF'}</strong> 서버 모드</span>
          </div>
        </div>

        <div className="hero-demo-card">
          <div className="demo-card-top"><span className="live-dot" /> 과정평가 흐름</div>
          <div className="flow-step active"><span>1</span><div><strong>독립 풀이</strong><small>첫 답과 확신도</small></div><b>✓</b></div>
          <div className="flow-line" />
          <div className="flow-step active"><span>2</span><div><strong>과정 증거</strong><small>문제 유형별 핵심 행동</small></div><b>✓</b></div>
          <div className="flow-line" />
          <div className="flow-step"><span>3</span><div><strong>최종 판단</strong><small>수정 여부와 이유</small></div><b>→</b></div>
          <div className="flow-line muted-line" />
          <div className="flow-step muted-step"><span>4</span><div><strong>독립 전이</strong><small>새 맥락에 적용</small></div><b>○</b></div>
          <div className="mini-profile">
            <div><span>조건 구조화</span><strong>84%</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: '84%' }} /></div>
            <div><span>평가·디버깅</span><strong>61%</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: '61%' }} /></div>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <Feature number="01" title="결과와 과정 분리" text="정답률만으로 추측과 전략적 해결을 동일하게 보지 않습니다." />
        <Feature number="02" title="교사가 직접 제작·배포" text="과정평가 문제를 만들고 과제 코드로 다른 기기에 배포할 수 있습니다." />
        <Feature number="03" title="전이로 학습 확인" text="표면이 다른 새 문제를 독립적으로 풀어 원리 이해를 확인합니다." />
      </section>
    </main>
  )

  function startLocalAssignment() {
    setSetupMessage('')
    setServerAccessCode(null)
    setStudentProblems(catalog.activeProblems)
    setView('student')
  }

  async function startServerAssignment() {
    setSetupBusy(true)
    setSetupMessage('')
    try {
      const published = await loadPublishedSet(classCode)
      if (!published) {
        setSetupMessage('해당 코드로 공개된 과제를 찾지 못했습니다. 코드와 공개 상태를 확인해 주세요.')
        return
      }
      setStudentProblems(published.problems)
      setServerAccessCode(published.accessCode)
      setView('student')
    } catch (error) {
      setSetupMessage(error instanceof Error ? error.message : '서버 과제를 불러오지 못했습니다.')
    } finally {
      setSetupBusy(false)
    }
  }

  async function saveServerAttempt(accessCode: string, attempt: Attempt) {
    try {
      await submitAttemptToServer(accessCode, attempt)
    } catch (error) {
      console.error('서버 제출 실패:', error)
      throw error
    }
  }
}

function Feature({ number, title, text }: { number: string; title: string; text: string }) {
  return <article><span>{number}</span><h2>{title}</h2><p>{text}</p></article>
}
