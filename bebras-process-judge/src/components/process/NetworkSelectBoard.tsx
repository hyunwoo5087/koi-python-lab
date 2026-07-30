import type { NetworkBoard, NetworkNode } from '../../types'

function edgeLength(from: NetworkNode, to: NetworkNode) {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

function edgeAngle(from: NetworkNode, to: NetworkNode) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

/**
 * 네트워크 조작형 과정 증거입니다.
 * 학생이 핵심 노드나 간선을 직접 눌러 고르게 합니다.
 */
export function NetworkSelectBoard({
  board,
  selections,
  onChange,
  readOnly = false,
}: {
  board: NetworkBoard
  selections: string[]
  onChange: (next: string[]) => void
  readOnly?: boolean
}) {
  const selected = new Set(selections)
  const byId = new Map(board.nodes.map((node) => [node.id, node]))
  const edgeClickable = board.target === 'edge' || board.target === 'both'
  const nodeClickable = board.target === 'node' || board.target === 'both'

  function toggle(id: string) {
    if (readOnly) return
    onChange(selected.has(id) ? selections.filter((item) => item !== id) : [...selections, id])
  }

  return (
    <div className="network-board">
      <svg viewBox="0 0 100 100" className="network-canvas" role="group" aria-label="통신망 그림">
        {board.edges.map((edge) => {
          const from = byId.get(edge.from)
          const to = byId.get(edge.to)
          if (!from || !to) return null
          const isSelected = selected.has(edge.id)
          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`network-edge ${isSelected ? 'selected' : ''} ${
                  edgeClickable ? 'clickable' : ''
                }`}
              />
              {edgeClickable && (
                /**
                 * 선을 직접 누르게 하면 가로·세로 선의 판정 영역 높이가 0이 됩니다.
                 * 선 위에 회전한 네모를 겹쳐 손가락으로도 누를 수 있게 합니다.
                 */
                <rect
                  x={from.x}
                  y={from.y - 3}
                  width={edgeLength(from, to)}
                  height={6}
                  rx={3}
                  transform={`rotate(${edgeAngle(from, to)} ${from.x} ${from.y})`}
                  className="network-edge-hit"
                  onClick={() => toggle(edge.id)}
                  role="button"
                  aria-label={`${edge.from}와 ${edge.to} 사이 연결`}
                  aria-pressed={isSelected}
                  tabIndex={readOnly ? -1 : 0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggle(edge.id)
                    }
                  }}
                />
              )}
            </g>
          )
        })}

        {board.nodes.map((node) => {
          const isSelected = selected.has(node.id)
          return (
            <g
              key={node.id}
              className={`network-node ${isSelected ? 'selected' : ''} ${
                nodeClickable ? 'clickable' : ''
              }`}
              onClick={() => nodeClickable && toggle(node.id)}
              role={nodeClickable ? 'button' : undefined}
              aria-label={nodeClickable ? `${node.label ?? node.id} 지점` : undefined}
              aria-pressed={nodeClickable ? isSelected : undefined}
              tabIndex={nodeClickable && !readOnly ? 0 : -1}
              onKeyDown={(event) => {
                if (nodeClickable && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  toggle(node.id)
                }
              }}
            >
              <circle cx={node.x} cy={node.y} r="6.5" />
              <text x={node.x} y={node.y + 2.2} textAnchor="middle">
                {node.label ?? node.id}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="network-board-status">
        <span>
          고른 {board.target === 'node' ? '지점' : board.target === 'both' ? '항목' : '연결'}{' '}
          <strong>{selections.length}</strong>개
        </span>
        {selections.length > 0 && <span className="network-picked">{selections.join(', ')}</span>}
        {!readOnly && (
          <button type="button" className="button ghost small-button" onClick={() => onChange([])}>
            선택 지우기
          </button>
        )}
      </div>
    </div>
  )
}
