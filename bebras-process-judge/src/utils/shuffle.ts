/** 같은 학생·같은 문항이면 항상 같은 순서가 나오는 섞기입니다. */
function hashSeed(seed: string) {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function nextRandom(state: number) {
  let value = state
  value ^= value << 13
  value >>>= 0
  value ^= value >>> 17
  value ^= value << 5
  value >>>= 0
  return value
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const next = [...items]
  let state = hashSeed(seed) || 1
  for (let index = next.length - 1; index > 0; index -= 1) {
    state = nextRandom(state)
    const target = state % (index + 1)
    ;[next[index], next[target]] = [next[target], next[index]]
  }
  return next
}

/**
 * 순서 배열 문항의 보기 순서를 섞습니다.
 * 섞은 결과가 정답 순서와 같으면 한 칸 밀어 정답이 그대로 보이지 않게 합니다.
 */
export function shuffleAwayFromAnswer(itemIds: string[], correct: string[], seed: string) {
  if (itemIds.length < 2) return itemIds
  let shuffled = seededShuffle(itemIds, seed)
  const matchesAnswer = () =>
    correct.length === shuffled.length && shuffled.every((id, index) => id === correct[index])
  if (matchesAnswer()) {
    shuffled = [...shuffled.slice(1), shuffled[0]]
  }
  return shuffled
}
