import { useMemo, useState, type ChangeEvent } from 'react'
import type { Choice, CtElement, DokLevel, Problem, ProcessStep } from '../types'
import { ctLabels, dokLabels, processTypeLabels } from '../utils/labels'
import {
  authoringProcessTypes,
  createProcessStep,
  toAuthoringType,
  type AuthoringProcessType,
} from '../services/problemCatalog'
import { reviewProblem } from '../services/validity'
import { ProblemPreview } from './ProblemPreview'
import { PathBoardEditor } from './editors/PathBoardEditor'
import { StateBoardEditor } from './editors/StateBoardEditor'
import { PatternBoardEditor } from './editors/PatternBoardEditor'
import { NetworkBoardEditor } from './editors/NetworkBoardEditor'

const presetVisuals: Array<{ value: Problem['visual']['type']; label: string }> = [
  { value: 'none', label: '그림 없음' },
  { value: 'custom', label: '내 그림 업로드' },
  { value: 'waterpark', label: '워터파크 예시 그림' },
  { value: 'route', label: '경로 예시 그림' },
  { value: 'robot', label: '로봇 예시 그림' },
  { value: 'pattern', label: '패턴 예시 그림' },
  { value: 'network', label: '네트워크 예시 그림' },
]

const processTemplates: Array<{
  type: AuthoringProcessType
  label: string
  help: string
}> = [
  {
    type: 'multi_select',
    label: '핵심 조건 선택',
    help: '조건·규칙 문제. 필요한 정보와 불필요한 정보를 구분합니다.',
  },
  {
    type: 'step_order',
    label: '해결 순서 배열',
    help: '절차 문제. 판단 절차의 순서를 확인합니다.',
  },
  {
    type: 'error_spot',
    label: '오류 찾기',
    help: '디버깅 문제. 잘못된 설명이나 규칙 적용을 진단합니다.',
  },
  {
    type: 'path_draw',
    label: '경로 그리기',
    help: '경로 문제. 학생이 격자에 직접 경로를 그립니다.',
  },
  {
    type: 'state_trace',
    label: '상태 추적',
    help: '상태 변화 문제. 단계별 중간 상태를 기록합니다.',
  },
  {
    type: 'pattern_mark',
    label: '패턴 표시',
    help: '패턴 문제. 반복 단위를 직접 감쌉니다.',
  },
  {
    type: 'network_select',
    label: '네트워크 조작',
    help: '네트워크 문제. 핵심 지점·연결을 고릅니다.',
  },
]

export function ProblemEditor({
  initialProblem,
  onSave,
  onCancel,
}: {
  initialProblem: Problem
  onSave: (problem: Problem) => void
  onCancel: () => void
}) {
  const [problem, setProblem] = useState<Problem>(() => structuredClone(initialProblem))
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [errors, setErrors] = useState<string[]>([])
  const [imageMessage, setImageMessage] = useState('')

  const isExisting = Boolean(initialProblem.createdAt)
  const validation = useMemo(() => validateProblem(problem), [problem])
  const review = useMemo(() => reviewProblem(problem), [problem])

  function submit() {
    const nextErrors = validateProblem(problem)
    setErrors(nextErrors)
    if (nextErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onSave({
      ...problem,
      version: isExisting ? problem.version + 1 : 1,
      origin: 'custom',
      rules: problem.rules?.map((rule) => rule.trim()).filter(Boolean),
      hints: problem.hints?.map((hint) => hint.trim()).filter(Boolean),
      choiceProbes: problem.choiceProbes?.filter((probe) => probe.question.trim()),
      updatedAt: new Date().toISOString(),
      createdAt: problem.createdAt ?? new Date().toISOString(),
    })
  }

  if (mode === 'preview') {
    return (
      <div className="authoring-workspace">
        <div className="authoring-toolbar sticky-toolbar">
          <div>
            <div className="eyebrow">학생 화면 미리보기</div>
            <h2>{problem.title}</h2>
          </div>
          <div className="button-row wrap">
            <button className="button ghost" onClick={() => setMode('edit')}>
              편집으로 돌아가기
            </button>
            <button className="button primary" disabled={validation.length > 0} onClick={submit}>
              저장
            </button>
          </div>
        </div>
        {validation.length > 0 && <ValidationBox errors={validation} />}
        <ProblemPreview problem={problem} />
      </div>
    )
  }

  return (
    <div className="authoring-workspace">
      <div className="authoring-toolbar sticky-toolbar">
        <div>
          <div className="eyebrow">문제 제작기</div>
          <h2>{isExisting ? '문제 수정' : '새 문제 만들기'}</h2>
        </div>
        <div className="button-row wrap">
          <button className="button ghost" onClick={onCancel}>
            취소
          </button>
          <button className="button secondary" onClick={() => setMode('preview')}>
            미리보기
          </button>
          <button className="button primary" onClick={submit}>
            저장
          </button>
        </div>
      </div>

      {errors.length > 0 && <ValidationBox errors={errors} />}

      {review.findings.length > 0 && (
        <section className="panel review-inline-panel">
          <div className="review-inline-head">
            <div className="eyebrow">타당성 검토</div>
            <span className={`review-score ${review.score >= 80 ? 'ok' : review.score >= 60 ? 'warn' : 'bad'}`}>
              {review.score}점
            </span>
          </div>
          <ul className="review-finding-list">
            {review.findings.map((finding, index) => (
              <li key={`${finding.title}-${index}`} className={`severity-${finding.severity}`}>
                <strong>{finding.title}</strong>
                <span>{finding.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel author-section">
        <SectionHeading
          number="1"
          title="기본 정보"
          text="학생이 이해할 수 있는 제목, 상황, 규칙을 입력합니다."
        />
        <div className="form-grid two-columns">
          <label className="field-label">
            문제 제목
            <input
              value={problem.title}
              maxLength={80}
              onChange={(event) => setProblem({ ...problem, title: event.target.value })}
            />
          </label>
          <label className="field-label">
            문제 분류
            <input
              value={problem.category}
              maxLength={40}
              placeholder="예: 조건·규칙, 경로·최적화"
              onChange={(event) => setProblem({ ...problem, category: event.target.value })}
            />
          </label>
        </div>
        <label className="field-label">
          문제 설명
          <textarea
            rows={4}
            value={problem.stem}
            onChange={(event) => setProblem({ ...problem, stem: event.target.value })}
          />
        </label>
        <div className="field-label">
          <span>규칙·조건</span>
          <div className="repeatable-list">
            {(problem.rules ?? []).map((rule, index) => (
              <div className="inline-edit-row" key={`rule-${index}`}>
                <span className="row-index">{index + 1}</span>
                <input value={rule} onChange={(event) => updateRule(index, event.target.value)} />
                <button
                  type="button"
                  className="icon-button danger-text"
                  aria-label="규칙 삭제"
                  onClick={() => removeRule(index)}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-row-button"
              onClick={() => setProblem({ ...problem, rules: [...(problem.rules ?? []), ''] })}
            >
              ＋ 규칙 추가
            </button>
          </div>
        </div>
        <div className="field-label">
          <span>측정할 컴퓨팅 사고 요소</span>
          <div className="check-chip-grid">
            {(Object.keys(ctLabels) as CtElement[]).map((element) => (
              <button
                type="button"
                key={element}
                className={`check-chip ${problem.ctElements.includes(element) ? 'selected' : ''}`}
                onClick={() => toggleCtElement(element)}
              >
                <span>{problem.ctElements.includes(element) ? '✓' : '+'}</span>
                {ctLabels[element]}
              </button>
            ))}
          </div>
        </div>
        <label className="field-label">
          DOK 보조 태그 (선택)
          <select
            value={problem.dokLevel ?? ''}
            onChange={(event) =>
              setProblem({
                ...problem,
                dokLevel: event.target.value ? (Number(event.target.value) as DokLevel) : undefined,
              })
            }
          >
            <option value="">사용하지 않음</option>
            {([1, 2, 3, 4] as DokLevel[]).map((level) => (
              <option key={level} value={level}>
                {dokLabels[level]}
              </option>
            ))}
          </select>
          <small className="form-help">
            DOK는 평가 축이 아닙니다. 문항의 인지적 요구 수준을 검토할 때만 참고하며 점수에는
            반영되지 않습니다.
          </small>
        </label>
      </section>

      <section className="panel author-section">
        <SectionHeading
          number="2"
          title="문제 그림"
          text="예시 그림을 사용하거나 직접 만든 PNG, JPG, SVG를 올릴 수 있습니다."
        />
        <div className="form-grid two-columns visual-editor-grid">
          <label className="field-label">
            그림 방식
            <select
              value={problem.visual.type}
              onChange={(event) =>
                setProblem({
                  ...problem,
                  visual: {
                    ...problem.visual,
                    type: event.target.value as Problem['visual']['type'],
                  },
                })
              }
            >
              {presetVisuals.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            그림 대체 설명
            <input
              value={problem.visual.alt ?? ''}
              placeholder="화면 낭독기용 설명"
              onChange={(event) =>
                setProblem({ ...problem, visual: { ...problem.visual, alt: event.target.value } })
              }
            />
          </label>
        </div>
        {problem.visual.type === 'custom' && (
          <div className="image-upload-box">
            <label className="button secondary upload-button">
              그림 파일 선택
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleImageUpload}
              />
            </label>
            <div>
              <strong>
                {problem.visual.src ? '그림이 등록되었습니다.' : '등록된 그림이 없습니다.'}
              </strong>
              <p>브라우저 저장 용량을 고려해 1MB 이하 파일을 권장합니다.</p>
              {imageMessage && <small>{imageMessage}</small>}
            </div>
            {problem.visual.src && (
              <button
                type="button"
                className="button ghost"
                onClick={() =>
                  setProblem({ ...problem, visual: { ...problem.visual, src: undefined } })
                }
              >
                그림 제거
              </button>
            )}
          </div>
        )}
      </section>

      <section className="panel author-section">
        <SectionHeading
          number="3"
          title="기본 정답 문항"
          text="학생의 첫 답과 최종 답에 사용할 선택지를 만듭니다."
        />
        <ChoiceEditor
          choices={problem.choices}
          correctAnswer={problem.correctAnswer}
          onChange={(choices, correctAnswer) => setProblem({ ...problem, choices, correctAnswer })}
        />
        <label className="field-label">
          정답 설명
          <textarea
            rows={3}
            value={problem.explanation}
            onChange={(event) => setProblem({ ...problem, explanation: event.target.value })}
          />
        </label>
      </section>

      <section className="panel author-section">
        <SectionHeading
          number="4"
          title="과정평가 문항"
          text="문제 유형에 가장 맞는 증거를 고르세요. 모든 문제에 같은 질문을 붙이지 않습니다."
        />
        <div className="template-buttons wide-templates">
          {processTemplates.map((template) => (
            <button type="button" key={template.type} onClick={() => addProcessStep(template.type)}>
              <strong>＋ {template.label}</strong>
              <small>{template.help}</small>
            </button>
          ))}
        </div>
        <div className="process-editor-list">
          {problem.processSteps.map((step, index) => (
            <ProcessStepEditor
              key={step.id}
              step={step}
              index={index}
              total={problem.processSteps.length}
              onChange={(next) => updateProcessStep(index, next)}
              onMove={(to) => moveProcessStep(index, to)}
              onDelete={() =>
                setProblem({
                  ...problem,
                  processSteps: problem.processSteps.filter((_, target) => target !== index),
                })
              }
            />
          ))}
        </div>
      </section>

      <section className="panel author-section">
        <SectionHeading
          number="5"
          title="독립 전이 문제"
          text="표면 상황은 다르지만 같은 해결 원리를 적용하는 문제를 만듭니다."
        />
        <label className="field-label">
          전이 문제 설명
          <textarea
            rows={4}
            value={problem.transfer.stem}
            onChange={(event) =>
              setProblem({ ...problem, transfer: { ...problem.transfer, stem: event.target.value } })
            }
          />
        </label>
        <ChoiceEditor
          choices={problem.transfer.choices}
          correctAnswer={problem.transfer.correctAnswer}
          onChange={(choices, correctAnswer) =>
            setProblem({ ...problem, transfer: { ...problem.transfer, choices, correctAnswer } })
          }
        />
        <label className="field-label">
          전이 정답 설명
          <textarea
            rows={3}
            value={problem.transfer.explanation}
            onChange={(event) =>
              setProblem({
                ...problem,
                transfer: { ...problem.transfer, explanation: event.target.value },
              })
            }
          />
        </label>
      </section>

      <section className="panel author-section">
        <SectionHeading
          number="6"
          title="정답을 주지 않는 도움말"
          text="학생이 막힐 때 볼 수 있는 힌트입니다. 정답 문장을 쓰면 저장할 수 없습니다."
        />
        <div className="field-label">
          <span>단계별 힌트 (위에서부터 순서대로 열립니다)</span>
          <div className="repeatable-list">
            {(problem.hints ?? []).map((hint, index) => (
              <div className="inline-edit-row" key={`hint-${index}`}>
                <span className="row-index">{index + 1}</span>
                <input
                  value={hint}
                  placeholder="예: 규칙 중 실제로 쓰이는 것을 골라 보세요."
                  onChange={(event) => {
                    const hints = [...(problem.hints ?? [])]
                    hints[index] = event.target.value
                    setProblem({ ...problem, hints })
                  }}
                />
                <button
                  type="button"
                  className="icon-button danger-text"
                  aria-label="힌트 삭제"
                  onClick={() =>
                    setProblem({
                      ...problem,
                      hints: (problem.hints ?? []).filter((_, target) => target !== index),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-row-button"
              disabled={(problem.hints ?? []).length >= 5}
              onClick={() => setProblem({ ...problem, hints: [...(problem.hints ?? []), ''] })}
            >
              ＋ 힌트 추가
            </button>
          </div>
          <small className="form-help">
            비워 두면 문제 분류에 맞는 기본 질문이 자동으로 사용됩니다.
          </small>
        </div>

        <div className="field-label">
          <span>선택지별 반례 질문</span>
          <div className="repeatable-list">
            {problem.choices.map((choice) => {
              const probe = problem.choiceProbes?.find((item) => item.choiceId === choice.id)
              return (
                <div className="inline-edit-row" key={`probe-${choice.id}`}>
                  <span className="row-index">{choice.id}</span>
                  <input
                    value={probe?.question ?? ''}
                    placeholder={`${choice.id}를 고른 학생에게 던질 질문 (선택)`}
                    onChange={(event) => updateProbe(choice.id, event.target.value)}
                  />
                </div>
              )
            })}
          </div>
          <small className="form-help">
            정답 선택지에도 질문을 넣어 두면 맞는 답을 고른 학생도 근거를 다시 확인합니다.
          </small>
        </div>
      </section>

      <section className="panel author-section publish-section">
        <div>
          <div className="eyebrow">공개 설정</div>
          <h2>학생 평가에 바로 포함할까요?</h2>
          <p>비활성 상태로 저장하면 교사 문제 목록에서 검토한 뒤 나중에 공개할 수 있습니다.</p>
        </div>
        <label className="switch-label">
          <input
            type="checkbox"
            checked={problem.isActive !== false}
            onChange={(event) => setProblem({ ...problem, isActive: event.target.checked })}
          />
          <span className="switch-control" />
          <strong>{problem.isActive !== false ? '학생에게 공개' : '비공개로 저장'}</strong>
        </label>
      </section>

      <div className="author-bottom-actions">
        <button className="button ghost" onClick={onCancel}>
          취소
        </button>
        <button className="button secondary" onClick={() => setMode('preview')}>
          학생 화면 미리보기
        </button>
        <button className="button primary" onClick={submit}>
          문제 저장
        </button>
      </div>
    </div>
  )

  function updateRule(index: number, value: string) {
    const rules = [...(problem.rules ?? [])]
    rules[index] = value
    setProblem({ ...problem, rules })
  }

  function removeRule(index: number) {
    setProblem({ ...problem, rules: (problem.rules ?? []).filter((_, target) => target !== index) })
  }

  function updateProbe(choiceId: string, question: string) {
    const probes = [...(problem.choiceProbes ?? [])]
    const index = probes.findIndex((probe) => probe.choiceId === choiceId)
    if (index >= 0) probes[index] = { choiceId, question }
    else probes.push({ choiceId, question })
    setProblem({ ...problem, choiceProbes: probes })
  }

  function toggleCtElement(element: CtElement) {
    const exists = problem.ctElements.includes(element)
    setProblem({
      ...problem,
      ctElements: exists
        ? problem.ctElements.filter((item) => item !== element)
        : [...problem.ctElements, element],
    })
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 1_500_000) {
      setImageMessage('파일이 1.5MB보다 큽니다. 더 작은 이미지로 줄여 주세요.')
      event.target.value = ''
      return
    }
    try {
      const src = await fileToDataUrl(file)
      setProblem({
        ...problem,
        visual: { ...problem.visual, type: 'custom', src, alt: problem.visual.alt || file.name },
      })
      setImageMessage(`${file.name} · ${Math.round(file.size / 1024)}KB`)
    } catch {
      setImageMessage('이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.')
    }
  }

  function addProcessStep(type: AuthoringProcessType) {
    setProblem({
      ...problem,
      processSteps: [...problem.processSteps, createProcessStep(type, problem.processSteps.length + 1)],
    })
  }

  function updateProcessStep(index: number, next: ProcessStep) {
    const steps = [...problem.processSteps]
    steps[index] = next
    setProblem({ ...problem, processSteps: steps })
  }

  function moveProcessStep(index: number, to: number) {
    if (to < 0 || to >= problem.processSteps.length) return
    const steps = [...problem.processSteps]
    const [target] = steps.splice(index, 1)
    steps.splice(to, 0, target)
    setProblem({ ...problem, processSteps: steps })
  }
}

function ChoiceEditor({
  choices,
  correctAnswer,
  onChange,
}: {
  choices: Choice[]
  correctAnswer: string
  onChange: (choices: Choice[], correctAnswer: string) => void
}) {
  function updateChoice(index: number, text: string) {
    const next = [...choices]
    next[index] = { ...next[index], text }
    onChange(next, correctAnswer)
  }

  function removeChoice(index: number) {
    if (choices.length <= 2) return
    const removed = choices[index]
    const next = choices
      .filter((_, target) => target !== index)
      .map((choice, target) => ({ ...choice, id: choiceId(target) }))
    const oldCorrectIndex = choices.findIndex((choice) => choice.id === correctAnswer)
    const nextCorrectIndex =
      removed.id === correctAnswer
        ? 0
        : oldCorrectIndex > index
          ? oldCorrectIndex - 1
          : oldCorrectIndex
    onChange(next, next[Math.max(0, nextCorrectIndex)]?.id ?? 'A')
  }

  function addChoice() {
    if (choices.length >= 8) return
    onChange(
      [...choices, { id: choiceId(choices.length), text: `선택지 ${choiceId(choices.length)}` }],
      correctAnswer,
    )
  }

  return (
    <div className="choice-editor">
      {choices.map((choice, index) => (
        <div className="choice-edit-row" key={choice.id}>
          <label className="correct-radio" title="정답으로 지정">
            <input
              type="radio"
              checked={choice.id === correctAnswer}
              onChange={() => onChange(choices, choice.id)}
            />
            <span>{choice.id}</span>
          </label>
          <input value={choice.text} onChange={(event) => updateChoice(index, event.target.value)} />
          <button
            type="button"
            className="icon-button danger-text"
            disabled={choices.length <= 2}
            onClick={() => removeChoice(index)}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-row-button"
        disabled={choices.length >= 8}
        onClick={addChoice}
      >
        ＋ 선택지 추가
      </button>
      <p className="form-help">왼쪽 원형 버튼으로 정답을 지정합니다.</p>
    </div>
  )
}

function ProcessStepEditor({
  step,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  step: ProcessStep
  index: number
  total: number
  onChange: (step: ProcessStep) => void
  onMove: (to: number) => void
  onDelete: () => void
}) {
  const supportedType = toAuthoringType(step.type)
  const usesItemList = supportedType === 'multi_select' || supportedType === 'error_spot'
  const usesOrderList = supportedType === 'step_order'

  function changeType(type: AuthoringProcessType) {
    const fresh = createProcessStep(type, index + 1)
    onChange({ ...fresh, id: step.id, question: fresh.question, instruction: fresh.instruction })
  }

  function updateItem(itemIndex: number, text: string) {
    const items = [...step.items]
    items[itemIndex] = { ...items[itemIndex], text }
    onChange({ ...step, items })
  }

  function toggleCorrect(itemId: string) {
    if (usesOrderList) return
    const single = step.type === 'error_spot' || step.maxSelections === 1
    onChange({
      ...step,
      correct: single
        ? [itemId]
        : step.correct.includes(itemId)
          ? step.correct.filter((id) => id !== itemId)
          : [...step.correct, itemId],
    })
  }

  function addItem() {
    if (step.items.length >= 10) return
    const id = `item-${Date.now()}-${step.items.length + 1}`
    const items = [...step.items, { id, text: `선택 항목 ${step.items.length + 1}` }]
    onChange({
      ...step,
      items,
      correct: usesOrderList ? items.map((item) => item.id) : step.correct,
    })
  }

  function removeItem(itemIndex: number) {
    if (step.items.length <= 2) return
    const id = step.items[itemIndex].id
    const items = step.items.filter((_, target) => target !== itemIndex)
    let correct = step.correct.filter((item) => item !== id)
    if (usesOrderList) correct = items.map((item) => item.id)
    if (correct.length === 0) correct = [items[0].id]
    onChange({ ...step, items, correct })
  }

  function moveItem(itemIndex: number, to: number) {
    if (to < 0 || to >= step.items.length) return
    const items = [...step.items]
    const [target] = items.splice(itemIndex, 1)
    items.splice(to, 0, target)
    onChange({ ...step, items, correct: usesOrderList ? items.map((item) => item.id) : step.correct })
  }

  return (
    <article className="process-editor-card">
      <header>
        <div>
          <span className="process-number">{index + 1}</span>
          <div>
            <strong>{processTypeLabels[step.type]}</strong>
            <small>{ctLabels[step.ctElement]}</small>
          </div>
        </div>
        <div className="mini-button-row">
          <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)}>
            ↑
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(index + 1)}>
            ↓
          </button>
          <button type="button" className="danger-text" disabled={total <= 1} onClick={onDelete}>
            삭제
          </button>
        </div>
      </header>
      <div className="form-grid two-columns">
        <label className="field-label">
          과정 유형
          <select
            value={supportedType}
            onChange={(event) => changeType(event.target.value as AuthoringProcessType)}
          >
            {authoringProcessTypes.map((type) => (
              <option value={type} key={type}>
                {processTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          연결 CT 요소
          <select
            value={step.ctElement}
            onChange={(event) => onChange({ ...step, ctElement: event.target.value as CtElement })}
          >
            {(Object.keys(ctLabels) as CtElement[]).map((element) => (
              <option value={element} key={element}>
                {ctLabels[element]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field-label">
        과정 확인 질문
        <input
          value={step.question}
          onChange={(event) => onChange({ ...step, question: event.target.value })}
        />
      </label>
      <label className="field-label">
        학생 안내 문구
        <input
          value={step.instruction ?? ''}
          placeholder="선택 사항"
          onChange={(event) => onChange({ ...step, instruction: event.target.value })}
        />
      </label>

      {(usesItemList || usesOrderList) && (
        <div className="process-item-editor">
          <div className="process-item-help">
            {usesOrderList
              ? '위에서 아래 순서가 정답 순서가 됩니다. 학생 화면에서는 자동으로 섞여 나옵니다.'
              : '정답인 항목의 왼쪽 표시를 선택하세요.'}
          </div>
          {step.items.map((item, itemIndex) => (
            <div className="process-item-row" key={item.id}>
              {usesOrderList ? (
                <span className="order-badge">{itemIndex + 1}</span>
              ) : (
                <label className="correct-radio small">
                  <input
                    type={step.type === 'error_spot' ? 'radio' : 'checkbox'}
                    checked={step.correct.includes(item.id)}
                    onChange={() => toggleCorrect(item.id)}
                  />
                  <span>{step.correct.includes(item.id) ? '✓' : ''}</span>
                </label>
              )}
              <input value={item.text} onChange={(event) => updateItem(itemIndex, event.target.value)} />
              {usesOrderList && (
                <div className="mini-button-row">
                  <button
                    type="button"
                    disabled={itemIndex === 0}
                    onClick={() => moveItem(itemIndex, itemIndex - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={itemIndex === step.items.length - 1}
                    onClick={() => moveItem(itemIndex, itemIndex + 1)}
                  >
                    ↓
                  </button>
                </div>
              )}
              <button
                type="button"
                className="icon-button danger-text"
                disabled={step.items.length <= 2}
                onClick={() => removeItem(itemIndex)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-row-button"
            disabled={step.items.length >= 10}
            onClick={addItem}
          >
            ＋ 항목 추가
          </button>
        </div>
      )}

      {supportedType === 'path_draw' && step.path && (
        <PathBoardEditor
          board={step.path}
          onChange={(path, correct) => onChange({ ...step, path, correct })}
        />
      )}

      {supportedType === 'state_trace' && step.states && (
        <StateBoardEditor
          board={step.states}
          onChange={(states, correct) => onChange({ ...step, states, correct })}
        />
      )}

      {supportedType === 'pattern_mark' && step.pattern && (
        <PatternBoardEditor
          board={step.pattern}
          correct={step.correct}
          onChange={(pattern, correct) => onChange({ ...step, pattern, correct })}
        />
      )}

      {supportedType === 'network_select' && step.network && (
        <NetworkBoardEditor
          board={step.network}
          correct={step.correct}
          onChange={(network, correct) => onChange({ ...step, network, correct })}
        />
      )}
    </article>
  )
}

function SectionHeading({
  number,
  title,
  text,
}: {
  number: string
  title: string
  text: string
}) {
  return (
    <div className="author-section-heading">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}

function ValidationBox({ errors }: { errors: string[] }) {
  return (
    <div className="validation-box">
      <strong>저장하기 전에 확인해 주세요.</strong>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

function validateProblem(problem: Problem) {
  const errors: string[] = []
  if (!problem.title.trim()) errors.push('문제 제목을 입력하세요.')
  if (!problem.category.trim()) errors.push('문제 분류를 입력하세요.')
  if (!problem.stem.trim()) errors.push('문제 설명을 입력하세요.')
  if (problem.ctElements.length === 0) errors.push('컴퓨팅 사고 요소를 하나 이상 선택하세요.')
  if (problem.choices.length < 2 || problem.choices.some((choice) => !choice.text.trim())) {
    errors.push('기본 문항의 선택지를 두 개 이상 모두 입력하세요.')
  }
  if (!problem.choices.some((choice) => choice.id === problem.correctAnswer)) {
    errors.push('기본 문항의 정답을 지정하세요.')
  }
  if (!problem.explanation.trim()) errors.push('기본 문항의 정답 설명을 입력하세요.')
  if (problem.processSteps.length === 0) errors.push('과정평가 문항을 하나 이상 추가하세요.')

  problem.processSteps.forEach((step, index) => {
    const label = `과정 ${index + 1}`
    if (!step.question.trim()) errors.push(`${label}의 질문을 입력하세요.`)

    if (step.type === 'path_draw') {
      if (!step.path) errors.push(`${label}의 격자를 설정하세요.`)
      else if (step.correct.length < 2) {
        errors.push(`${label}의 도착점에 도달할 수 없습니다. 막힌 칸을 조정하세요.`)
      }
      return
    }

    if (step.type === 'state_trace') {
      const stages = step.states?.stages ?? []
      if (stages.length === 0) errors.push(`${label}의 추적 단계를 추가하세요.`)
      stages.forEach((stage, stageIndex) => {
        if (!stage.label.trim()) errors.push(`${label}의 ${stageIndex + 1}단계 설명을 입력하세요.`)
        if (stage.options.some((option) => !option.text.trim())) {
          errors.push(`${label}의 ${stageIndex + 1}단계 보기를 모두 입력하세요.`)
        }
        if (!stage.options.some((option) => option.id === stage.correctId)) {
          errors.push(`${label}의 ${stageIndex + 1}단계 정답을 지정하세요.`)
        }
      })
      return
    }

    if (step.type === 'pattern_mark') {
      const tokens = step.pattern?.tokens ?? []
      if (tokens.length < 4) errors.push(`${label}의 무늬를 네 칸 이상 입력하세요.`)
      if (step.correct.length === 0) errors.push(`${label}의 반복 단위를 표시하세요.`)
      return
    }

    if (step.type === 'network_select') {
      const network = step.network
      if (!network || network.nodes.length < 3) errors.push(`${label}의 지점을 세 개 이상 두세요.`)
      if (!network || network.edges.length < 2) errors.push(`${label}의 연결선을 두 개 이상 두세요.`)
      if (step.correct.length === 0) errors.push(`${label}의 정답 항목을 지정하세요.`)
      return
    }

    if (step.items.length < 2 || step.items.some((item) => !item.text.trim())) {
      errors.push(`${label}의 항목을 두 개 이상 모두 입력하세요.`)
    }
    if (
      step.correct.length === 0 ||
      step.correct.some((id) => !step.items.some((item) => item.id === id))
    ) {
      errors.push(`${label}의 정답을 지정하세요.`)
    }
  })

  if (!problem.transfer.stem.trim()) errors.push('전이 문제 설명을 입력하세요.')
  if (
    problem.transfer.choices.length < 2 ||
    problem.transfer.choices.some((choice) => !choice.text.trim())
  ) {
    errors.push('전이 문제의 선택지를 두 개 이상 모두 입력하세요.')
  }
  if (!problem.transfer.choices.some((choice) => choice.id === problem.transfer.correctAnswer)) {
    errors.push('전이 문제의 정답을 지정하세요.')
  }
  if (!problem.transfer.explanation.trim()) errors.push('전이 문제의 정답 설명을 입력하세요.')
  if (problem.visual.type === 'custom' && !problem.visual.src) {
    errors.push('내 그림 업로드를 선택했으면 그림 파일을 등록하세요.')
  }

  // 정답을 노출하는 힌트는 저장을 막습니다.
  const review = reviewProblem(problem)
  review.findings
    .filter((finding) => finding.severity === 'blocker' && finding.title.includes('힌트'))
    .forEach((finding) => errors.push(finding.title))

  return [...new Set(errors)]
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('invalid file'))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function choiceId(index: number) {
  return String.fromCharCode(65 + index)
}
