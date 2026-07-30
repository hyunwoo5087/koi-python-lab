import { useState } from 'react'
import type { PathBoard } from '../../types'
import { cellKey, findShortestPath, shortestMoves } from '../../utils/grid'

type PaintMode = 'blocked' | 'start' | 'goal'

/** 경로 그리기형 문항의 격자를 만듭니다. */
export function PathBoardEditor({
  board,
  onChange,
}: {
  board: PathBoard
  onChange: (board: PathBoard, correct: string[]) => void
}) {
  const [mode, setMode] = useState<PaintMode>('blocked')
  const optimal = shortestMoves(board)

  function commit(next: PathBoard) {
    onChange({ ...next, optimalMoves: shortestMoves(next) ?? undefined }, findShortestPath(next))
  }

  function resize(key: 'width' | 'height', value: number) {
    const size = Math.min(12, Math.max(2, Math.round(value) || 2))
    const next: PathBoard = { ...board, [key]: size }
    const inside = (cell: string) => {
      const [x, y] = cell.split(',').map(Number)
      return x >= 1 && x <= next.width && y >= 1 && y <= next.height
    }
    next.blocked = board.blocked.filter(inside)
    if (!inside(next.start)) next.start = cellKey(1, 1)
    if (!inside(next.goal)) next.goal = cellKey(next.width, next.height)
    commit(next)
  }

  function paint(key: string) {
    if (mode === 'start') {
      if (key === board.goal) return
      commit({ ...board, start: key, blocked: board.blocked.filter((cell) => cell !== key) })
      return
    }
    if (mode === 'goal') {
      if (key === board.start) return
      commit({ ...board, goal: key, blocked: board.blocked.filter((cell) => cell !== key) })
      return
    }
    if (key === board.start || key === board.goal) return
    const blocked = new Set(board.blocked)
    if (blocked.has(key)) blocked.delete(key)
    else blocked.add(key)
    commit({ ...board, blocked: [...blocked] })
  }

  const rows = Array.from({ length: board.height }, (_, index) => board.height - index)
  const columns = Array.from({ length: board.width }, (_, index) => index + 1)
  const blocked = new Set(board.blocked)

  return (
    <div className="board-editor">
      <div className="form-grid two-columns">
        <label className="field-label">
          가로 칸 수
          <input
            type="number"
            min={2}
            max={12}
            value={board.width}
            onChange={(event) => resize('width', Number(event.target.value))}
          />
        </label>
        <label className="field-label">
          세로 칸 수
          <input
            type="number"
            min={2}
            max={12}
            value={board.height}
            onChange={(event) => resize('height', Number(event.target.value))}
          />
        </label>
      </div>

      <div className="segmented compact-segmented">
        {(
          [
            ['blocked', '막힌 칸 칠하기'],
            ['start', '출발점 지정'],
            ['goal', '도착점 지정'],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={mode === value ? 'selected' : ''}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="path-grid editor-grid"
        style={{ gridTemplateColumns: `repeat(${board.width}, minmax(1.9rem, 1fr))` }}
      >
        {rows.map((y) =>
          columns.map((x) => {
            const key = cellKey(x, y)
            const isStart = key === board.start
            const isGoal = key === board.goal
            return (
              <button
                key={key}
                type="button"
                className={`path-cell ${blocked.has(key) ? 'blocked' : ''} ${
                  isStart ? 'start' : ''
                } ${isGoal ? 'goal' : ''}`}
                onClick={() => paint(key)}
                aria-label={`${x}, ${y} 칸`}
              >
                {blocked.has(key) ? '×' : isStart ? 'S' : isGoal ? 'G' : ''}
              </button>
            )
          }),
        )}
      </div>

      {optimal === null ? (
        <div className="validation-box compact">
          <strong>도착점에 도달할 수 없습니다.</strong>
          <p>막힌 칸이 길을 완전히 끊고 있습니다. 칸을 다시 확인하세요.</p>
        </div>
      ) : (
        <p className="form-help">
          최소 이동 <strong>{optimal}번</strong>입니다. 학생이 같은 길이의 다른 최단 경로를 그려도
          정답으로 인정합니다.
        </p>
      )}
    </div>
  )
}
