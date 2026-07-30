import { useMemo, type ReactNode } from 'react'
import type { ProcessItem, ProcessStep } from '../types'
import { ctLabels, processTypeLabels } from '../utils/labels'
import { shuffleAwayFromAnswer } from '../utils/shuffle'
import { PathDrawBoard } from './process/PathDrawBoard'
import { StateTraceBoard } from './process/StateTraceBoard'
import { PatternMarkBoard } from './process/PatternMarkBoard'
import { NetworkSelectBoard } from './process/NetworkSelectBoard'

const singleSelectTypes = [
  'single_select',
  'state_select',
  'pattern_select',
  'edge_select',
  'error_spot',
]

export function ProcessPrompt({
  prompt,
  selections,
  onChange,
  stepNumber,
  stepTotal,
  shuffleSeed = '',
}: {
  prompt: ProcessStep
  selections: string[]
  onChange: (next: string[]) => void
  stepNumber: number
  stepTotal: number
  /** 학생마다 보기 순서를 다르게 하려면 값을 넘깁니다. */
  shuffleSeed?: string
}) {
  const heading = <ProcessHeading prompt={prompt} stepNumber={stepNumber} stepTotal={stepTotal} />

  if (prompt.type === 'path_draw' && prompt.path) {
    return (
      <div className="process-box">
        {heading}
        <PathDrawBoard board={prompt.path} cells={selections} onChange={onChange} />
      </div>
    )
  }

  if (prompt.type === 'state_trace' && prompt.states) {
    return (
      <div className="process-box">
        {heading}
        <StateTraceBoard board={prompt.states} selections={selections} onChange={onChange} />
      </div>
    )
  }

  if (prompt.type === 'pattern_mark' && prompt.pattern) {
    return (
      <div className="process-box">
        {heading}
        <PatternMarkBoard board={prompt.pattern} selections={selections} onChange={onChange} />
      </div>
    )
  }

  if (prompt.type === 'network_select' && prompt.network) {
    return (
      <div className="process-box">
        {heading}
        <NetworkSelectBoard board={prompt.network} selections={selections} onChange={onChange} />
      </div>
    )
  }

  if (prompt.type === 'step_order') {
    return (
      <div className="process-box">
        {heading}
        <ol className="step-order-list">
          {selections.map((id, index) => {
            const item = prompt.items.find((candidate) => candidate.id === id)
            if (!item) return null
            return (
              <li key={id} className="step-order-item">
                <span className="order-number">{index + 1}</span>
                <span className="order-text">{item.text}</span>
                <span className="order-controls">
                  <button
                    type="button"
                    aria-label={`${item.text} 위로 이동`}
                    disabled={index === 0}
                    onClick={() => onChange(move(selections, index, index - 1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.text} 아래로 이동`}
                    disabled={index === selections.length - 1}
                    onClick={() => onChange(move(selections, index, index + 1))}
                  >
                    ↓
                  </button>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <SelectPrompt
      prompt={prompt}
      selections={selections}
      onChange={onChange}
      heading={heading}
      shuffleSeed={shuffleSeed}
    />
  )
}

function SelectPrompt({
  prompt,
  selections,
  onChange,
  heading,
  shuffleSeed,
}: {
  prompt: ProcessStep
  selections: string[]
  onChange: (next: string[]) => void
  heading: ReactNode
  shuffleSeed: string
}) {
  const single = prompt.maxSelections === 1 || singleSelectTypes.includes(prompt.type)

  // 보기 순서를 학생마다 다르게 해서 위치를 외우는 풀이를 막습니다.
  const orderedItems = useMemo(() => {
    if (!shuffleSeed) return prompt.items
    const order = shuffleAwayFromAnswer(
      prompt.items.map((item) => item.id),
      prompt.correct,
      `${shuffleSeed}:${prompt.id}`,
    )
    return order
      .map((id) => prompt.items.find((item) => item.id === id))
      .filter((item): item is ProcessItem => Boolean(item))
  }, [prompt.correct, prompt.id, prompt.items, shuffleSeed])

  function toggle(id: string) {
    if (single) {
      onChange([id])
      return
    }
    onChange(
      selections.includes(id) ? selections.filter((item) => item !== id) : [...selections, id],
    )
  }

  return (
    <div className="process-box">
      {heading}
      <div className="process-options">
        {orderedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`process-option ${selections.includes(item.id) ? 'selected' : ''}`}
            onClick={() => toggle(item.id)}
            aria-pressed={selections.includes(item.id)}
          >
            <span className={`check-mark ${single ? 'round' : ''}`}>
              {selections.includes(item.id) ? '✓' : ''}
            </span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProcessHeading({
  prompt,
  stepNumber,
  stepTotal,
}: {
  prompt: ProcessStep
  stepNumber: number
  stepTotal: number
}) {
  return (
    <>
      <div className="process-meta-row">
        <div className="eyebrow">
          과정 증거 {stepNumber}/{stepTotal} · {processTypeLabels[prompt.type]}
        </div>
        <span className="ct-evidence-chip">{ctLabels[prompt.ctElement]}</span>
      </div>
      <h3>{prompt.question}</h3>
      {prompt.instruction && <p className="muted process-instruction">{prompt.instruction}</p>}
    </>
  )
}

function move(items: string[], from: number, to: number) {
  const next = [...items]
  const [target] = next.splice(from, 1)
  next.splice(to, 0, target)
  return next
}
