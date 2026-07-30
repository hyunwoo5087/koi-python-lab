import { useMemo, useState } from 'react'
import type { Attempt, ProblemCatalog } from '../types'
import { buildAiUsage, buildCalibration, buildCtProfile, buildQuadrant, summarizeAttempt } from '../judge/judge'
import { clearAttempts, loadAttempts, saveAttempt } from '../services/storage'
import { downloadAttemptsCsv, downloadResponsesCsv } from '../services/csv'
import { createDemoAttempts } from '../data/demoAttempts'
import { ResultProfile } from './ResultProfile'
import { ProblemManager } from './ProblemManager'
import { ServerPanel } from './ServerPanel'
import { BulkImportPanel } from './BulkImportPanel'
import { ValidityPanel } from './ValidityPanel'

type Tab = 'results' | 'problems' | 'bulk' | 'validity' | 'server'

const tabCopy: Record<Tab, { title: string; note: string }> = {
  results: {
    title: '학급 사고과정 현황',
    note: '학생의 첫 답, 과정 증거, 최종 답, 전이를 분리해 확인합니다.',
  },
  problems: {
    title: '과정평가 문제 제작',
    note: '문제, 과정 증거, 전이 문항을 직접 만들고 공개 여부를 관리합니다.',
  },
  bulk: {
    title: '문제 일괄 등록',
    note: '준비한 비버 문제를 JSON으로 한 번에 올리고 내보냅니다.',
  },
  validity: {
    title: '과정평가 타당성 검토',
    note: '문제 유형에 맞는 증거인지, 정답이 새지 않는지 검사합니다.',
  },
  server: {
    title: '서버 과제 배포',
    note: '과제 코드로 문제를 배포하고 다른 기기의 학생 제출을 확인합니다.',
  },
}

export function TeacherDashboard({
  catalog,
  onCatalogChanged,
  onBack,
}: {
  catalog: ProblemCatalog
  onCatalogChanged: () => void
  onBack: () => void
}) {
  const [tab, setTab] = useState<Tab>('results')
  const [attempts, setAttempts] = useState<Attempt[]>(() => loadAttempts())
  const [selectedId, setSelectedId] = useState<string | null>(attempts[0]?.id ?? null)
  const selected = attempts.find((item) => item.id === selectedId) ?? null
  const problems = catalog.allProblems

  const classSummary = useMemo(() => {
    if (attempts.length === 0) return { initial: 0, process: 0, final: 0, transfer: 0 }
    const summaries = attempts.map(summarizeAttempt)
    const average = (key: keyof (typeof summaries)[number]) =>
      Math.round(summaries.reduce((sum, item) => sum + item[key], 0) / summaries.length)
    return {
      initial: average('initialPercent'),
      process: average('processPercent'),
      final: average('finalPercent'),
      transfer: average('transferPercent'),
    }
  }, [attempts])

  const classCt = useMemo(() => {
    if (attempts.length === 0) return []
    const profiles = attempts.map((attempt) => buildCtProfile(attempt, problems))
    return profiles[0].map((base, index) => {
      const measured = profiles.filter((profile) => profile[index].total > 0)
      return {
        label: base.label,
        measured: measured.length,
        percent:
          measured.length === 0
            ? 0
            : Math.round(
                measured.reduce((sum, profile) => sum + profile[index].percent, 0) / measured.length,
              ),
      }
    })
  }, [attempts, problems])

  /** 학급 전체의 결과·과정 교차와 AI 활용을 따로 모읍니다. */
  const classInsight = useMemo(() => {
    const quadrants = attempts.map((attempt) => buildQuadrant(attempt))
    const calibrations = attempts.map((attempt) => buildCalibration(attempt))
    const aiUsages = attempts.map((attempt) => buildAiUsage(attempt))
    return {
      likelyGuess: quadrants.reduce((sum, item) => sum + item.likelyGuess, 0),
      strategic: quadrants.reduce((sum, item) => sum + item.strategic, 0),
      overconfident: calibrations.reduce((sum, item) => sum + item.overconfident, 0),
      aiTotal: aiUsages.reduce((sum, item) => sum + item.total, 0),
      aiStudents: aiUsages.filter((item) => item.total > 0).length,
    }
  }, [attempts])

  function seed() {
    const demos = createDemoAttempts(catalog.activeProblems)
    demos.forEach(saveAttempt)
    setAttempts(loadAttempts())
    setSelectedId(demos[0]?.id ?? null)
  }

  function reset() {
    if (!window.confirm('저장된 모든 시도 기록을 삭제할까요?')) return
    clearAttempts()
    setAttempts([])
    setSelectedId(null)
  }

  return (
    <main className="app-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow">교사 공간</div>
          <h1>{tabCopy[tab].title}</h1>
          <p className="muted">{tabCopy[tab].note}</p>
        </div>
        <div className="button-row wrap">
          <button className="button ghost" onClick={onBack}>
            처음으로
          </button>
        </div>
      </div>

      <nav className="teacher-tabs" aria-label="교사 메뉴">
        <button className={tab === 'results' ? 'selected' : ''} onClick={() => setTab('results')}>
          <span>▥</span>학급 결과
        </button>
        <button className={tab === 'problems' ? 'selected' : ''} onClick={() => setTab('problems')}>
          <span>✎</span>문제 제작·관리 <em>{catalog.activeProblems.length}</em>
        </button>
        <button className={tab === 'bulk' ? 'selected' : ''} onClick={() => setTab('bulk')}>
          <span>⇪</span>일괄 등록
        </button>
        <button className={tab === 'validity' ? 'selected' : ''} onClick={() => setTab('validity')}>
          <span>◎</span>타당성 검토
        </button>
        <button className={tab === 'server' ? 'selected' : ''} onClick={() => setTab('server')}>
          <span>☁</span>서버 배포
        </button>
      </nav>

      {tab === 'problems' ? (
        <ProblemManager catalog={catalog} onCatalogChanged={onCatalogChanged} />
      ) : tab === 'bulk' ? (
        <BulkImportPanel catalog={catalog} onCatalogChanged={onCatalogChanged} />
      ) : tab === 'validity' ? (
        <ValidityPanel catalog={catalog} />
      ) : tab === 'server' ? (
        <ServerPanel catalog={catalog} />
      ) : (
        <>
          <div className="dashboard-action-row">
            <div className="active-assignment-note">
              <strong>현재 학생 공개 문제 {catalog.activeProblems.length}개</strong>
              <span>문제 제작·관리 메뉴에서 공개 대상을 바꿀 수 있습니다.</span>
            </div>
            <div className="button-row wrap">
              <button className="button secondary" onClick={seed}>
                예시 데이터
              </button>
              <button
                className="button secondary"
                disabled={attempts.length === 0}
                onClick={() => downloadAttemptsCsv(attempts, problems)}
              >
                학생별 CSV
              </button>
              <button
                className="button secondary"
                disabled={attempts.length === 0}
                onClick={() => downloadResponsesCsv(attempts, problems)}
              >
                문제별 CSV
              </button>
              <button className="button danger" disabled={attempts.length === 0} onClick={reset}>
                기록 초기화
              </button>
            </div>
          </div>

          <section className="metric-grid dashboard-metrics">
            <DashboardMetric label="참여 학생" value={`${attempts.length}명`} />
            <DashboardMetric label="독립 정답률" value={`${classSummary.initial}%`} />
            <DashboardMetric label="과정 수행률" value={`${classSummary.process}%`} />
            <DashboardMetric label="전이 정답률" value={`${classSummary.transfer}%`} />
          </section>

          {attempts.length === 0 ? (
            <section className="panel empty-state">
              <div className="empty-icon">⌁</div>
              <h2>아직 완료된 시도가 없습니다.</h2>
              <p>학생 모드에서 문제를 풀거나 ‘예시 데이터’를 눌러 대시보드를 확인하세요.</p>
            </section>
          ) : (
            <>
              <section className="panel class-insight-panel">
                <div className="eyebrow">해석 도움말</div>
                <div className="insight-grid">
                  <div className="insight-card tone-good">
                    <span>전략적 해결</span>
                    <strong>{classInsight.strategic}건</strong>
                    <small>정답이고 과정 증거도 충분한 사례</small>
                  </div>
                  <div className="insight-card tone-warn">
                    <span>추측 의심</span>
                    <strong>{classInsight.likelyGuess}건</strong>
                    <small>정답이지만 과정 증거가 약한 사례</small>
                  </div>
                  <div className="insight-card tone-info">
                    <span>과신 사례</span>
                    <strong>{classInsight.overconfident}건</strong>
                    <small>확실하다고 했지만 첫 답이 틀린 사례</small>
                  </div>
                  <div className="insight-card tone-plain">
                    <span>AI 도움 사용</span>
                    <strong>{classInsight.aiTotal}회</strong>
                    <small>{classInsight.aiStudents}명이 사용 · 점수와 분리</small>
                  </div>
                </div>
              </section>

              <div className="dashboard-layout">
                <section className="panel student-list-panel">
                  <div className="panel-title-row">
                    <h2>학생 목록</h2>
                    <span>{attempts.length}명</span>
                  </div>
                  <div className="student-list">
                    {attempts.map((attempt) => {
                      const summary = summarizeAttempt(attempt)
                      const ai = buildAiUsage(attempt)
                      return (
                        <button
                          type="button"
                          key={attempt.id}
                          className={`student-row ${selectedId === attempt.id ? 'selected' : ''}`}
                          onClick={() => setSelectedId(attempt.id)}
                        >
                          <span className="avatar">{attempt.nickname.slice(0, 1)}</span>
                          <span className="student-info">
                            <strong>{attempt.nickname}</strong>
                            <small>
                              {attempt.classCode} · 전이 {summary.transferPercent}% · AI {ai.total}회
                            </small>
                          </span>
                          <span className="student-score">{summary.finalPercent}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="panel class-ct-panel">
                  <div className="eyebrow">학급 CT 프로파일</div>
                  <h2>요소별 수행률</h2>
                  <div className="profile-bars compact">
                    {classCt.map((item) => (
                      <div className="profile-row" key={item.label}>
                        <div className="profile-label">
                          <span>{item.label}</span>
                          <strong>{item.measured === 0 ? '측정 없음' : `${item.percent}%`}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${item.measured === 0 ? 'empty' : ''}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="form-help">
                    ‘측정 없음’은 그 요소에 연결된 과정 증거가 없다는 뜻입니다. 타당성 검토 메뉴에서
                    확인하세요.
                  </p>
                </section>
              </div>
            </>
          )}

          {selected && <ResultProfile attempt={selected} problems={problems} />}
        </>
      )}
    </main>
  )
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
