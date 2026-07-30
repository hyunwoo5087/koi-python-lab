import type { PatternBoard } from '../../types'
import { smallestPeriod } from '../../utils/grid'
import { PatternMarkBoard } from '../process/PatternMarkBoard'

/** 패턴 표시형 문항의 무늬와 반복 단위를 정합니다. */
export function PatternBoardEditor({
  board,
  correct,
  onChange,
}: {
  board: PatternBoard
  correct: string[]
  onChange: (board: PatternBoard, correct: string[]) => void
}) {
  const period = smallestPeriod(board.tokens)

  function updateTokens(text: string) {
    const tokens = text
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 24)
    const nextPeriod = smallestPeriod(tokens)
    onChange(
      { tokens, unitLength: nextPeriod },
      Array.from({ length: nextPeriod }, (_, index) => String(index)),
    )
  }

  function markUnit(selections: string[]) {
    const indexes = selections
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
      .sort((a, b) => a - b)
    if (indexes.length === 0) return
    onChange({ ...board, unitLength: indexes.length }, indexes.map((index) => String(index)))
  }

  return (
    <div className="board-editor">
      <label className="field-label">
        무늬 (칸을 띄어쓰기나 쉼표로 구분)
        <input
          value={board.tokens.join(' ')}
          placeholder="예: ● ▲ ▲ ● ▲ ▲ ● ▲ ▲"
          onChange={(event) => updateTokens(event.target.value)}
        />
      </label>

      <div className="process-item-help">
        아래에서 반복 단위를 직접 표시하면 정답이 저장됩니다. 학생 화면과 같은 방식입니다.
      </div>
      <PatternMarkBoard board={board} selections={correct} onChange={markUnit} />

      <p className="form-help">
        무늬에서 계산한 가장 작은 주기는 <strong>{period}칸</strong>입니다.
        {board.unitLength !== period && (
          <span className="danger-text"> 지금 지정한 단위는 {board.unitLength}칸으로 다릅니다.</span>
        )}{' '}
        학생이 같은 주기의 다른 시작 위치를 표시해도 정답으로 인정합니다.
      </p>
    </div>
  )
}
