import type { StateBoard } from '../../types'

/** 상태 추적형 문항의 단계별 중간 상태를 만듭니다. */
export function StateBoardEditor({
  board,
  onChange,
}: {
  board: StateBoard
  onChange: (board: StateBoard, correct: string[]) => void
}) {
  function commit(stages: StateBoard['stages']) {
    onChange({ stages }, stages.map((stage) => stage.correctId))
  }

  function updateStage(index: number, next: StateBoard['stages'][number]) {
    const stages = [...board.stages]
    stages[index] = next
    commit(stages)
  }

  function addStage() {
    if (board.stages.length >= 8) return
    const timestamp = Date.now()
    const options = [
      { id: `state-${timestamp}-a`, text: '상태 설명 1' },
      { id: `state-${timestamp}-b`, text: '상태 설명 2' },
      { id: `state-${timestamp}-c`, text: '상태 설명 3' },
    ]
    commit([
      ...board.stages,
      {
        id: `stage-${timestamp}`,
        label: `${board.stages.length + 1}번째 명령을 실행한 직후`,
        options,
        correctId: options[0].id,
      },
    ])
  }

  return (
    <div className="board-editor">
      {board.stages.map((stage, stageIndex) => (
        <article className="stage-editor-card" key={stage.id}>
          <div className="stage-editor-head">
            <span className="order-badge">{stageIndex + 1}</span>
            <input
              value={stage.label}
              placeholder="예: 두 번째 명령을 실행한 직후"
              onChange={(event) => updateStage(stageIndex, { ...stage, label: event.target.value })}
            />
            <button
              type="button"
              className="icon-button danger-text"
              disabled={board.stages.length <= 1}
              aria-label="단계 삭제"
              onClick={() => commit(board.stages.filter((_, index) => index !== stageIndex))}
            >
              ×
            </button>
          </div>

          <div className="process-item-help">정답 상태의 왼쪽 표시를 선택하세요.</div>
          {stage.options.map((option, optionIndex) => (
            <div className="process-item-row" key={option.id}>
              <label className="correct-radio small">
                <input
                  type="radio"
                  name={`stage-${stage.id}`}
                  checked={stage.correctId === option.id}
                  onChange={() => updateStage(stageIndex, { ...stage, correctId: option.id })}
                />
                <span>{stage.correctId === option.id ? '✓' : ''}</span>
              </label>
              <input
                value={option.text}
                onChange={(event) => {
                  const options = [...stage.options]
                  options[optionIndex] = { ...option, text: event.target.value }
                  updateStage(stageIndex, { ...stage, options })
                }}
              />
              <button
                type="button"
                className="icon-button danger-text"
                disabled={stage.options.length <= 2}
                aria-label="보기 삭제"
                onClick={() => {
                  const options = stage.options.filter((_, index) => index !== optionIndex)
                  updateStage(stageIndex, {
                    ...stage,
                    options,
                    correctId: options.some((item) => item.id === stage.correctId)
                      ? stage.correctId
                      : options[0].id,
                  })
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-row-button"
            disabled={stage.options.length >= 6}
            onClick={() =>
              updateStage(stageIndex, {
                ...stage,
                options: [
                  ...stage.options,
                  {
                    id: `state-${Date.now()}-${stage.options.length + 1}`,
                    text: `상태 설명 ${stage.options.length + 1}`,
                  },
                ],
              })
            }
          >
            ＋ 상태 보기 추가
          </button>
        </article>
      ))}

      <button
        type="button"
        className="add-row-button"
        disabled={board.stages.length >= 8}
        onClick={addStage}
      >
        ＋ 추적 단계 추가
      </button>
      <p className="form-help">단계마다 1점씩 채점합니다. 두 단계 이상이어야 상태 변화를 볼 수 있습니다.</p>
    </div>
  )
}
