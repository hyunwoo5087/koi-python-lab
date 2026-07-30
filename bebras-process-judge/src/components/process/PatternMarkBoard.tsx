import type { PatternBoard } from '../../types'

/**
 * 패턴 표시형 과정 증거입니다.
 * 학생이 반복 단위를 직접 감싸게 해서 패턴 인식을 눈에 보이게 만듭니다.
 */
export function PatternMarkBoard({
  board,
  selections,
  onChange,
  readOnly = false,
}: {
  board: PatternBoard
  selections: string[]
  onChange: (next: string[]) => void
  readOnly?: boolean
}) {
  const marked = selections
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < board.tokens.length)
    .sort((a, b) => a - b)

  const first = marked[0]
  const last = marked[marked.length - 1]

  function emit(indexes: number[]) {
    onChange([...new Set(indexes)].sort((a, b) => a - b).map((index) => String(index)))
  }

  function handleToken(index: number) {
    if (readOnly) return
    if (marked.length === 0) {
      emit([index])
      return
    }
    if (index === first && marked.length > 1) {
      emit(marked.slice(1))
      return
    }
    if (index === last && marked.length > 1) {
      emit(marked.slice(0, -1))
      return
    }
    if (index === first && marked.length === 1) {
      emit([])
      return
    }
    if (index === first - 1 || index === last + 1) {
      emit([...marked, index])
      return
    }
    if (index > first && index < last) {
      emit(range(first, index))
      return
    }
    emit([index])
  }

  return (
    <div className="pattern-board">
      <div className="pattern-token-row">
        {board.tokens.map((token, index) => {
          const isMarked = marked.includes(index)
          return (
            <button
              key={`${token}-${index}`}
              type="button"
              className={`pattern-token ${isMarked ? 'marked' : ''} ${
                index === first ? 'unit-start' : ''
              } ${index === last ? 'unit-end' : ''}`}
              disabled={readOnly}
              aria-pressed={isMarked}
              aria-label={`${index + 1}번째 ${token}`}
              onClick={() => handleToken(index)}
            >
              <span className="pattern-token-index">{index + 1}</span>
              <span className="pattern-token-face">{token}</span>
            </button>
          )
        })}
      </div>
      <div className="pattern-board-status">
        <span>
          표시한 길이 <strong>{marked.length}</strong>칸
        </span>
        {marked.length > 0 && (
          <span className="pattern-preview">
            {marked.map((index) => board.tokens[index]).join(' ')}
          </span>
        )}
        {!readOnly && (
          <button type="button" className="button ghost small-button" onClick={() => emit([])}>
            표시 지우기
          </button>
        )}
      </div>
      {!readOnly && (
        <p className="muted board-help">
          이어진 칸만 표시할 수 있습니다. 양쪽 끝을 다시 누르면 한 칸씩 줄어듭니다.
        </p>
      )}
    </div>
  )
}

function range(from: number, to: number) {
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
