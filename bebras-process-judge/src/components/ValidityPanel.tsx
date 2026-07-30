import { useMemo, useState } from 'react'
import type { CtElement, ProblemCatalog } from '../types'
import { reviewCatalog } from '../services/validity'
import { ctLabels, processTypeLabels } from '../utils/labels'

/** 문제별 과정평가 타당성 검토 화면입니다. */
export function ValidityPanel({ catalog }: { catalog: ProblemCatalog }) {
  const [scope, setScope] = useState<'active' | 'all'>('active')
  const problems = scope === 'active' ? catalog.activeProblems : catalog.allProblems
  const review = useMemo(() => reviewCatalog(problems), [problems])
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="validity-panel">
      <section className="panel validity-hero">
        <div>
          <div className="eyebrow">과정평가 타당성 검토</div>
          <h2>과정 증거가 문제 유형에 맞는지 확인합니다.</h2>
          <p>
            같은 서술형 질문을 모든 문제에 붙이지 않았는지, 증거가 정답을 그대로 알려 주지 않는지,
            표시한 사고 요소를 실제로 측정하는지 검사합니다.
          </p>
        </div>
        <div className="segmented compact-segmented">
          <button className={scope === 'active' ? 'selected' : ''} onClick={() => setScope('active')}>
            공개 문제
          </button>
          <button className={scope === 'all' ? 'selected' : ''} onClick={() => setScope('all')}>
            전체 문제
          </button>
        </div>
      </section>

      <section className="metric-grid dashboard-metrics">
        <div className="metric-card dashboard-metric">
          <span>검토 문제</span>
          <strong>{problems.length}개</strong>
        </div>
        <div className="metric-card dashboard-metric">
          <span>평균 타당성 점수</span>
          <strong>{review.averageScore}점</strong>
        </div>
        <div className="metric-card dashboard-metric">
          <span>반드시 고칠 항목</span>
          <strong>{review.blockerCount}건</strong>
        </div>
        <div className="metric-card dashboard-metric">
          <span>사용된 과정 유형</span>
          <strong>{review.typeUsage.length}종</strong>
        </div>
      </section>

      <div className="validity-columns">
        <section className="panel">
          <div className="eyebrow">사고 요소 커버리지</div>
          <h3>어떤 요소를 몇 번 측정하나요?</h3>
          <div className="profile-bars compact">
            {(Object.keys(ctLabels) as CtElement[]).map((element) => {
              const count = review.elementCoverage[element]
              const max = Math.max(1, ...Object.values(review.elementCoverage))
              return (
                <div className="profile-row" key={element}>
                  <div className="profile-label">
                    <span>{ctLabels[element]}</span>
                    <strong>{count === 0 ? '측정 없음' : `${count}문항`}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${count === 0 ? 'empty' : ''}`}
                      style={{ width: `${Math.round((count / max) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="form-help">
            0인 요소가 있으면 그 축의 프로파일은 해석할 수 없습니다. 일반화·전이는 전이 문제에서도
            자동으로 채워집니다.
          </p>
        </section>

        <section className="panel">
          <div className="eyebrow">과정 증거 유형 분포</div>
          <h3>유형이 한쪽으로 몰리지 않았나요?</h3>
          {review.typeUsage.length === 0 ? (
            <p className="muted">검토할 과정 증거가 없습니다.</p>
          ) : (
            <ul className="type-usage-list">
              {review.typeUsage
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <li key={item.type}>
                    <span>{processTypeLabels[item.type as keyof typeof processTypeLabels]}</span>
                    <strong>{item.count}문항</strong>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="eyebrow">문제별 검토 결과</div>
        {review.reports.length === 0 ? (
          <p className="muted">검토할 문제가 없습니다.</p>
        ) : (
          <div className="validity-report-list">
            {review.reports
              .sort((a, b) => a.score - b.score)
              .map((report) => (
                <article key={report.problemId} className="validity-report-row">
                  <button
                    type="button"
                    className="validity-report-head"
                    onClick={() => setOpenId(openId === report.problemId ? null : report.problemId)}
                  >
                    <span
                      className={`review-score ${
                        report.score >= 80 ? 'ok' : report.score >= 60 ? 'warn' : 'bad'
                      }`}
                    >
                      {report.score}
                    </span>
                    <span className="validity-report-title">
                      <strong>{report.title}</strong>
                      <small>
                        {report.coveredElements.map((element) => ctLabels[element]).join(', ') ||
                          '측정 요소 없음'}
                      </small>
                    </span>
                    <span className="validity-report-count">
                      {report.findings.length === 0
                        ? '문제 없음'
                        : `${report.findings.length}건 확인`}
                    </span>
                  </button>
                  {openId === report.problemId && report.findings.length > 0 && (
                    <ul className="review-finding-list">
                      {report.findings.map((finding, index) => (
                        <li key={`${finding.title}-${index}`} className={`severity-${finding.severity}`}>
                          <strong>{finding.title}</strong>
                          <span>{finding.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
