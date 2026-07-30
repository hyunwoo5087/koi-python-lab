import { useMemo, useState } from 'react'
import type { Problem, ProblemCatalog } from '../types'
import {
  createBlankProblem,
  deleteCustomProblem,
  duplicateProblem,
  saveCustomProblem,
  setBuiltInProblemActive,
  setCustomProblemActive,
} from '../services/problemCatalog'
import { ProblemEditor } from './ProblemEditor'
import { ProblemPreview } from './ProblemPreview'
import { dokLabels, processTypeLabels } from '../utils/labels'

export function ProblemManager({
  catalog,
  onCatalogChanged,
}: {
  catalog: ProblemCatalog
  onCatalogChanged: () => void
}) {
  const [editorProblem, setEditorProblem] = useState<Problem | null>(null)
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'custom'>('all')
  const [query, setQuery] = useState('')

  const visibleProblems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return catalog.allProblems.filter((problem) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && problem.isActive !== false) ||
        (filter === 'inactive' && problem.isActive === false) ||
        (filter === 'custom' && problem.origin === 'custom')
      const matchesQuery = !normalized || `${problem.title} ${problem.category}`.toLowerCase().includes(normalized)
      return matchesFilter && matchesQuery
    })
  }, [catalog.allProblems, filter, query])

  if (editorProblem) {
    return (
      <ProblemEditor
        initialProblem={editorProblem}
        onCancel={() => setEditorProblem(null)}
        onSave={(problem) => {
          try {
            saveCustomProblem(problem)
            setEditorProblem(null)
            onCatalogChanged()
          } catch {
            window.alert('문제를 저장하지 못했습니다. 업로드한 그림의 용량을 줄이거나 브라우저 저장 공간을 확인해 주세요.')
          }
        }}
      />
    )
  }

  if (previewProblem) {
    return (
      <div className="authoring-workspace">
        <div className="authoring-toolbar sticky-toolbar">
          <div><div className="eyebrow">문제 미리보기</div><h2>{previewProblem.title}</h2></div>
          <div className="button-row wrap">
            <button className="button ghost" onClick={() => setPreviewProblem(null)}>문제 목록</button>
            <button className="button secondary" onClick={() => copyProblem(previewProblem)}>복제해서 편집</button>
            {previewProblem.origin === 'custom' && <button className="button primary" onClick={() => { setPreviewProblem(null); setEditorProblem(structuredClone(previewProblem)) }}>수정</button>}
          </div>
        </div>
        <ProblemPreview problem={previewProblem} />
      </div>
    )
  }

  return (
    <div className="problem-manager">
      <section className="problem-manager-hero panel">
        <div>
          <div className="eyebrow">교사용 문제 제작·관리</div>
          <h2>소스 코드를 수정하지 않고 과정평가 문제를 만드세요.</h2>
          <p>기본 정답, 과정 증거, 전이 문제를 한 화면에서 설계하고 학생 평가 공개 여부를 관리합니다.</p>
        </div>
        <button className="button primary large" onClick={() => setEditorProblem(createBlankProblem())}>＋ 새 문제 만들기</button>
      </section>

      <section className="problem-library-summary">
        <SummaryCard label="전체 문제" value={catalog.allProblems.length} />
        <SummaryCard label="학생 공개" value={catalog.activeProblems.length} />
        <SummaryCard label="직접 만든 문제" value={catalog.customProblems.length} />
        <SummaryCard label="비공개" value={catalog.allProblems.length - catalog.activeProblems.length} />
      </section>

      <section className="panel problem-library-panel">
        <div className="problem-library-toolbar">
          <div className="segmented compact-segmented">
            {([
              ['all', '전체'],
              ['active', '공개'],
              ['inactive', '비공개'],
              ['custom', '직접 제작'],
            ] as const).map(([value, label]) => (
              <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <input className="search-input" value={query} placeholder="문제 제목 또는 분류 검색" onChange={(event) => setQuery(event.target.value)} />
        </div>

        {visibleProblems.length === 0 ? (
          <div className="empty-state compact-empty"><h3>조건에 맞는 문제가 없습니다.</h3><p>검색어를 지우거나 새 문제를 만들어 보세요.</p></div>
        ) : (
          <div className="problem-library-list">
            {visibleProblems.map((problem) => (
              <article className="problem-library-row" key={problem.id}>
                <div className={`problem-status-dot ${problem.isActive !== false ? 'active' : ''}`} />
                <div className="problem-library-main">
                  <div className="problem-title-line">
                    <strong>{problem.title}</strong>
                    <span className={`origin-chip ${problem.origin === 'custom' ? 'custom' : ''}`}>{problem.origin === 'custom' ? '직접 제작' : '기본 문제'}</span>
                    <span className={`visibility-chip ${problem.isActive !== false ? 'active' : ''}`}>{problem.isActive !== false ? '학생 공개' : '비공개'}</span>
                  </div>
                  <p>
                    {problem.category} · v{problem.version}
                    {problem.dokLevel !== undefined ? ` · ${dokLabels[problem.dokLevel]}` : ''}
                    <br />
                    과정 증거: {problem.processSteps.map((step) => processTypeLabels[step.type]).join(', ') || '없음'}
                  </p>
                </div>
                <div className="problem-row-actions">
                  <button className="button ghost small-button" onClick={() => setPreviewProblem(problem)}>미리보기</button>
                  <button className="button ghost small-button" onClick={() => copyProblem(problem)}>복제</button>
                  {problem.origin === 'custom' && <button className="button secondary small-button" onClick={() => setEditorProblem(structuredClone(problem))}>수정</button>}
                  <button className="button ghost small-button" onClick={() => toggleActive(problem)}>{problem.isActive !== false ? '비공개' : '공개'}</button>
                  {problem.origin === 'custom' && <button className="button ghost small-button danger-text" onClick={() => removeProblem(problem)}>삭제</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel local-storage-note">
        <div className="note-icon">i</div>
        <div><strong>문제는 이 브라우저에 저장됩니다.</strong><p>다른 컴퓨터의 학생에게 배포하려면 서버 배포 메뉴에서 Supabase에 로그인한 뒤 과제 코드로 게시하세요. 여러 문제를 한 번에 올리려면 일괄 등록 메뉴를 사용하세요.</p></div>
      </section>
    </div>
  )

  function copyProblem(problem: Problem) {
    const copy = duplicateProblem(problem)
    setPreviewProblem(null)
    setEditorProblem(copy)
  }

  function toggleActive(problem: Problem) {
    const next = problem.isActive === false
    if (problem.origin === 'custom') setCustomProblemActive(problem.id, next)
    else setBuiltInProblemActive(problem.id, next)
    onCatalogChanged()
  }

  function removeProblem(problem: Problem) {
    if (!window.confirm(`“${problem.title}” 문제를 삭제할까요? 저장된 학생 풀이 기록은 삭제되지 않습니다.`)) return
    deleteCustomProblem(problem.id)
    onCatalogChanged()
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="problem-summary-card"><span>{label}</span><strong>{value}</strong></div>
}
