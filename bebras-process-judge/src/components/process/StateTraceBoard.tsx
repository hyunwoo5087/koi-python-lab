import type { StateBoard } from '../../types'

/**
 * 상태 추적형 과정 증거입니다.
 * 단계마다 중간 상태를 고르게 해서 머릿속 시뮬레이션을 드러냅니다.
 */
export function StateTraceBoard({
  board,
  selections,
  onChange,
  readOnly = false,
}: {
  board: StateBoard
  selections: string[]
  onChange: (next: string[]) => void
  readOnly?: boolean
}) {
  function pick(stageIndex: number, optionId: string) {
    if (readOnly) return
    const next = [...selections]
    while (next.length < board.stages.length) next.push('')
    next[stageIndex] = next[stageIndex] === optionId ? '' : optionId
    onChange(next)
  }

  return (
    <div className="state-trace-board">
      {board.stages.map((stage, stageIndex) => (
        <section className="state-stage" key={stage.id}>
          <div className="state-stage-heading">
            <span className="state-stage-number">{stageIndex + 1}</span>
            <strong>{stage.label}</strong>
          </div>
          <div className="state-stage-options">
            {stage.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`state-option ${selections[stageIndex] === option.id ? 'selected' : ''}`}
                disabled={readOnly}
                aria-pressed={selections[stageIndex] === option.id}
                onClick={() => pick(stageIndex, option.id)}
              >
                <span className="check-mark round">
                  {selections[stageIndex] === option.id ? '✓' : ''}
                </span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="muted board-help">
        모든 단계를 채워야 다음으로 넘어갈 수 있습니다. 앞 단계를 고친 뒤 뒤 단계도 다시 확인해 보세요.
      </p>
    </div>
  )
}
