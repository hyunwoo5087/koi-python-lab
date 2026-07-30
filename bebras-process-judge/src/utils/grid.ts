import type { PathBoard } from '../types'

/** 격자 좌표는 'x,y' 문자열로 저장합니다. 왼쪽 아래가 (1,1)입니다. */
export function cellKey(x: number, y: number) {
  return `${x},${y}`
}

export function parseCell(key: string): { x: number; y: number } | null {
  const match = /^(-?\d+),(-?\d+)$/.exec(key.trim())
  if (!match) return null
  return { x: Number(match[1]), y: Number(match[2]) }
}

export function isInsideBoard(board: PathBoard, key: string) {
  const cell = parseCell(key)
  if (!cell) return false
  return cell.x >= 1 && cell.x <= board.width && cell.y >= 1 && cell.y <= board.height
}

export function neighbors(board: PathBoard, key: string) {
  const cell = parseCell(key)
  if (!cell) return []
  const blocked = new Set(board.blocked)
  return [
    cellKey(cell.x + 1, cell.y),
    cellKey(cell.x - 1, cell.y),
    cellKey(cell.x, cell.y + 1),
    cellKey(cell.x, cell.y - 1),
  ].filter((candidate) => isInsideBoard(board, candidate) && !blocked.has(candidate))
}

export function areAdjacent(a: string, b: string) {
  const first = parseCell(a)
  const second = parseCell(b)
  if (!first || !second) return false
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1
}

/** 막힌 칸을 피해 이동한 최소 이동 횟수입니다. 도달할 수 없으면 null입니다. */
export function shortestMoves(board: PathBoard): number | null {
  if (!isInsideBoard(board, board.start) || !isInsideBoard(board, board.goal)) return null
  const blocked = new Set(board.blocked)
  if (blocked.has(board.start) || blocked.has(board.goal)) return null
  if (board.start === board.goal) return 0

  const distance = new Map<string, number>([[board.start, 0]])
  const queue = [board.start]
  while (queue.length > 0) {
    const current = queue.shift() as string
    const currentDistance = distance.get(current) ?? 0
    for (const next of neighbors(board, current)) {
      if (distance.has(next)) continue
      distance.set(next, currentDistance + 1)
      if (next === board.goal) return currentDistance + 1
      queue.push(next)
    }
  }
  return null
}

/** 기준 최단 경로 한 개를 만듭니다. 문제 제작기의 정답 경로 초기값으로 씁니다. */
export function findShortestPath(board: PathBoard): string[] {
  if (!isInsideBoard(board, board.start) || !isInsideBoard(board, board.goal)) return []
  const blocked = new Set(board.blocked)
  if (blocked.has(board.start) || blocked.has(board.goal)) return []
  if (board.start === board.goal) return [board.start]

  const cameFrom = new Map<string, string | null>([[board.start, null]])
  const queue = [board.start]
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const next of neighbors(board, current)) {
      if (cameFrom.has(next)) continue
      cameFrom.set(next, current)
      if (next === board.goal) {
        const path: string[] = []
        let step: string | null = next
        while (step) {
          path.unshift(step)
          step = cameFrom.get(step) ?? null
        }
        return path
      }
      queue.push(next)
    }
  }
  return []
}

export interface PathCheck {
  startsAtStart: boolean
  endsAtGoal: boolean
  connected: boolean
  avoidsBlocked: boolean
  noRevisit: boolean
  moves: number
  optimalMoves: number | null
  isOptimal: boolean
}

/** 학생이 그린 경로를 항목별로 점검합니다. */
export function checkDrawnPath(board: PathBoard, cells: string[]): PathCheck {
  const blocked = new Set(board.blocked)
  const optimalMoves = board.optimalMoves ?? shortestMoves(board)
  const moves = Math.max(0, cells.length - 1)

  let connected = cells.length > 0
  for (let index = 1; index < cells.length; index += 1) {
    if (!areAdjacent(cells[index - 1], cells[index])) {
      connected = false
      break
    }
  }

  return {
    startsAtStart: cells[0] === board.start,
    endsAtGoal: cells.length > 0 && cells[cells.length - 1] === board.goal,
    connected,
    avoidsBlocked: cells.every((cell) => !blocked.has(cell) && isInsideBoard(board, cell)),
    noRevisit: new Set(cells).size === cells.length,
    moves,
    optimalMoves,
    isOptimal: optimalMoves !== null && moves === optimalMoves,
  }
}

/** 토큰 나열에서 가장 작은 반복 주기를 찾습니다. */
export function smallestPeriod(tokens: string[]) {
  for (let length = 1; length <= tokens.length; length += 1) {
    let tiles = true
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index] !== tokens[index % length]) {
        tiles = false
        break
      }
    }
    if (tiles) return length
  }
  return tokens.length
}

/** 선택한 인덱스들이 이어진 한 덩어리인지 확인합니다. */
export function isContiguous(indexes: number[]) {
  if (indexes.length === 0) return false
  const sorted = [...indexes].sort((a, b) => a - b)
  return sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1)
}
