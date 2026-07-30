import type { NetworkBoard } from '../../types'
import { NetworkSelectBoard } from '../process/NetworkSelectBoard'

/** 네트워크 조작형 문항의 노드·간선과 정답을 정합니다. */
export function NetworkBoardEditor({
  board,
  correct,
  onChange,
}: {
  board: NetworkBoard
  correct: string[]
  onChange: (board: NetworkBoard, correct: string[]) => void
}) {
  const nodeIds = board.nodes.map((node) => node.id)

  function commit(next: NetworkBoard, nextCorrect = correct) {
    const validIds = new Set([
      ...next.nodes.map((node) => node.id),
      ...next.edges.map((edge) => edge.id),
    ])
    onChange(next, nextCorrect.filter((id) => validIds.has(id)))
  }

  function addNode() {
    if (board.nodes.length >= 10) return
    const used = new Set(nodeIds)
    const id =
      'ABCDEFGHIJ'.split('').find((letter) => !used.has(letter)) ?? `N${board.nodes.length + 1}`
    commit({ ...board, nodes: [...board.nodes, { id, x: 50, y: 50 }] })
  }

  function addEdge() {
    if (board.nodes.length < 2 || board.edges.length >= 16) return
    const from = board.nodes[0].id
    const to = board.nodes[1].id
    const id = `${from}-${to}`
    if (board.edges.some((edge) => edge.id === id)) return
    commit({ ...board, edges: [...board.edges, { id, from, to }] })
  }

  function updateEdge(index: number, key: 'from' | 'to', value: string) {
    const edges = [...board.edges]
    const next = { ...edges[index], [key]: value }
    next.id = `${next.from}-${next.to}`
    edges[index] = next
    commit({ ...board, edges })
  }

  return (
    <div className="board-editor">
      <label className="field-label">
        학생이 고를 대상
        <select
          value={board.target}
          onChange={(event) =>
            commit({ ...board, target: event.target.value as NetworkBoard['target'] })
          }
        >
          <option value="edge">연결선만</option>
          <option value="node">지점만</option>
          <option value="both">지점과 연결선 모두</option>
        </select>
      </label>

      <div className="network-editor-columns">
        <div>
          <div className="process-item-help">지점 (그림 위 위치는 0~100 사이 값)</div>
          {board.nodes.map((node, index) => (
            <div className="network-editor-row" key={node.id}>
              <input
                className="tiny-input"
                value={node.id}
                maxLength={3}
                onChange={(event) => {
                  const nextId = event.target.value.toUpperCase().trim()
                  if (!nextId || nodeIds.some((id, target) => id === nextId && target !== index)) {
                    return
                  }
                  const nodes = [...board.nodes]
                  const previousId = node.id
                  nodes[index] = { ...node, id: nextId }
                  const edges = board.edges.map((edge) => {
                    const from = edge.from === previousId ? nextId : edge.from
                    const to = edge.to === previousId ? nextId : edge.to
                    return { id: `${from}-${to}`, from, to }
                  })
                  commit(
                    { ...board, nodes, edges },
                    correct.map((id) => (id === previousId ? nextId : id)),
                  )
                }}
              />
              <input
                className="tiny-input"
                type="number"
                min={0}
                max={100}
                value={node.x}
                onChange={(event) => {
                  const nodes = [...board.nodes]
                  nodes[index] = { ...node, x: clamp(Number(event.target.value)) }
                  commit({ ...board, nodes })
                }}
              />
              <input
                className="tiny-input"
                type="number"
                min={0}
                max={100}
                value={node.y}
                onChange={(event) => {
                  const nodes = [...board.nodes]
                  nodes[index] = { ...node, y: clamp(Number(event.target.value)) }
                  commit({ ...board, nodes })
                }}
              />
              <input
                value={node.label ?? ''}
                placeholder="이름(선택)"
                onChange={(event) => {
                  const nodes = [...board.nodes]
                  nodes[index] = { ...node, label: event.target.value || undefined }
                  commit({ ...board, nodes })
                }}
              />
              <button
                type="button"
                className="icon-button danger-text"
                disabled={board.nodes.length <= 3}
                aria-label="지점 삭제"
                onClick={() =>
                  commit({
                    ...board,
                    nodes: board.nodes.filter((_, target) => target !== index),
                    edges: board.edges.filter(
                      (edge) => edge.from !== node.id && edge.to !== node.id,
                    ),
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
            disabled={board.nodes.length >= 10}
            onClick={addNode}
          >
            ＋ 지점 추가
          </button>
        </div>

        <div>
          <div className="process-item-help">연결선</div>
          {board.edges.map((edge, index) => (
            <div className="network-editor-row" key={`${edge.id}-${index}`}>
              <select value={edge.from} onChange={(event) => updateEdge(index, 'from', event.target.value)}>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <span className="edge-dash">—</span>
              <select value={edge.to} onChange={(event) => updateEdge(index, 'to', event.target.value)}>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button danger-text"
                aria-label="연결선 삭제"
                onClick={() =>
                  commit({ ...board, edges: board.edges.filter((_, target) => target !== index) })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-row-button"
            disabled={board.edges.length >= 16}
            onClick={addEdge}
          >
            ＋ 연결선 추가
          </button>
        </div>
      </div>

      <div className="process-item-help">
        아래 그림에서 정답을 직접 눌러 지정하세요. 학생 화면과 같은 방식입니다.
      </div>
      <NetworkSelectBoard
        board={board}
        selections={correct}
        onChange={(next) => commit(board, next)}
      />
      {correct.length === 0 && (
        <p className="form-help danger-text">정답으로 인정할 항목을 하나 이상 눌러 주세요.</p>
      )}
    </div>
  )
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value)))
}
