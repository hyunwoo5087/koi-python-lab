import type { PathBoard } from '../../types'
import { areAdjacent, cellKey, shortestMoves } from '../../utils/grid'

/**
 * 경로 그리기형 과정 증거입니다.
 * 학생이 칸을 눌러 직접 경로를 만들고, 마지막 칸을 다시 누르면 되돌립니다.
 */
export function PathDrawBoard({
  board,
  cells,
  onChange,
  readOnly = false,
}: {
  board: PathBoard
  cells: string[]
  onChange: (next: string[]) => void
  readOnly?: boolean
}) {
  const blocked = new Set(board.blocked)
  const pathIndex = new Map(cells.map((cell, index) => [cell, index]))
  const last = cells[cells.length - 1]
  const optimal = board.optimalMoves ?? shortestMoves(board)

  function handleCell(key: string) {
    if (readOnly || blocked.has(key)) return

    if (cells.length === 0) {
      if (key === board.start) onChange([board.start])
      return
    }
    if (key === last) {
      onChange(cells.slice(0, -1))
      return
    }
    const existing = pathIndex.get(key)
    if (existing !== undefined) {
      onChange(cells.slice(0, existing + 1))
      return
    }
    if (areAdjacent(last, key)) {
      onChange([...cells, key])
    }
  }

  const rows = Array.from({ length: board.height }, (_, index) => board.height - index)
  const columns = Array.from({ length: board.width }, (_, index) => index + 1)

  return (
    <div className="path-board">
      <div className="path-board-toolbar">
        <span className="path-legend"><i className="legend-start" />출발</span>
        <span className="path-legend"><i className="legend-goal" />도착</span>
        <span className="path-legend"><i className="legend-blocked" />막힌 칸</span>
        <span className="path-move-count">
          이동 {Math.max(0, cells.length - 1)}번
          {optimal !== null && optimal !== undefined ? ` · 최소 ${optimal}번 이하로` : ''}
        </span>
        {!readOnly && (
          <button type="button" className="button ghost small-button" onClick={() => onChange([])}>
            처음부터
          </button>
        )}
      </div>

      <div
        className="path-grid"
        style={{ gridTemplateColumns: `repeat(${board.width}, minmax(2.2rem, 1fr))` }}
        role="group"
        aria-label="경로 그리기 격자"
      >
        {rows.map((y) =>
          columns.map((x) => {
            const key = cellKey(x, y)
            const order = pathIndex.get(key)
            const isBlocked = blocked.has(key)
            const isStart = key === board.start
            const isGoal = key === board.goal
            const classes = [
              'path-cell',
              isBlocked ? 'blocked' : '',
              isStart ? 'start' : '',
              isGoal ? 'goal' : '',
              order !== undefined ? 'on-path' : '',
              key === last ? 'tip' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={key}
                type="button"
                className={classes}
                disabled={readOnly || isBlocked}
                aria-label={`${x}, ${y} 칸${isStart ? ' 출발점' : ''}${isGoal ? ' 도착점' : ''}${
                  isBlocked ? ' 막힘' : ''
                }`}
                aria-pressed={order !== undefined}
                onClick={() => handleCell(key)}
              >
                {isBlocked ? '×' : order !== undefined ? order + 1 : isStart ? 'S' : isGoal ? 'G' : ''}
              </button>
            )
          }),
        )}
      </div>

      {cells.length === 0 && !readOnly && (
        <p className="muted board-help">출발점 S를 눌러 경로를 시작하세요.</p>
      )}
    </div>
  )
}
