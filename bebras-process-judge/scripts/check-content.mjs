#!/usr/bin/env node
/**
 * 문제 데이터 자체 검사입니다.
 *
 *   npm run check:content
 *
 * 격자가 실제로 풀리는지, 패턴 주기가 맞는지, 정답이 선택지 안에 있는지,
 * 힌트가 정답을 노출하지 않는지 검사합니다.
 * Vite에 이미 포함된 esbuild로 TypeScript를 즉석에서 묶어 실행합니다.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workDir = mkdtempSync(join(tmpdir(), 'bebras-check-'))
const outFile = join(workDir, 'bundle.mjs')

const entry = `
export { problems } from '${join(projectRoot, 'src/data/problems.ts').replaceAll('\\', '/')}'
export { starterPack } from '${join(projectRoot, 'src/data/starterPack.ts').replaceAll('\\', '/')}'
export { shortestMoves, smallestPeriod, checkDrawnPath } from '${join(projectRoot, 'src/utils/grid.ts').replaceAll('\\', '/')}'
export { judgeProblemProcess } from '${join(projectRoot, 'src/judge/judge.ts').replaceAll('\\', '/')}'
export { reviewProblem } from '${join(projectRoot, 'src/services/validity.ts').replaceAll('\\', '/')}'
export { buildHint, leaksAnswer } from '${join(projectRoot, 'src/services/tutor.ts').replaceAll('\\', '/')}'
`

try {
  await esbuild.build({
    stdin: { contents: entry, resolveDir: projectRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: outFile,
    logLevel: 'error',
  })
} catch (error) {
  console.error('[오류] TypeScript를 묶는 데 실패했습니다.')
  console.error(error instanceof Error ? error.message : error)
  rmSync(workDir, { recursive: true, force: true })
  process.exit(1)
}

const mod = await import(pathToFileURL(outFile).href)
const {
  problems,
  starterPack,
  shortestMoves,
  smallestPeriod,
  checkDrawnPath,
  judgeProblemProcess,
  reviewProblem,
  buildHint,
  leaksAnswer,
} = mod

const failures = []
const notes = []

function fail(scope, message) {
  failures.push(`${scope}: ${message}`)
}

function checkProblem(problem, scope) {
  if (!problem.choices.some((choice) => choice.id === problem.correctAnswer)) {
    fail(scope, `정답 ${problem.correctAnswer}가 선택지에 없습니다.`)
  }
  if (!problem.transfer.choices.some((choice) => choice.id === problem.transfer.correctAnswer)) {
    fail(scope, `전이 정답 ${problem.transfer.correctAnswer}가 선택지에 없습니다.`)
  }
  if (problem.processSteps.length === 0) fail(scope, '과정 증거가 없습니다.')

  // 힌트가 정답을 노출하면 안 됩니다.
  ;(problem.hints ?? []).forEach((hint, index) => {
    if (leaksAnswer(hint, problem)) fail(scope, `${index + 1}번째 힌트가 정답을 노출합니다.`)
  })
  for (let depth = 1; depth <= 4; depth += 1) {
    const reply = buildHint(problem, depth)
    if (leaksAnswer(reply.message, problem)) {
      fail(scope, `자동 생성 힌트 ${depth}단계가 정답을 노출합니다.`)
    }
  }

  problem.processSteps.forEach((step, stepIndex) => {
    const stepScope = `${scope} / 과정 ${stepIndex + 1} (${step.type})`

    if (step.type === 'path_draw') {
      if (!step.path) {
        fail(stepScope, '격자 정보가 없습니다.')
        return
      }
      const optimal = shortestMoves(step.path)
      if (optimal === null) {
        fail(stepScope, '도착점에 도달할 수 없습니다.')
        return
      }
      if (step.path.optimalMoves !== undefined && step.path.optimalMoves !== optimal) {
        fail(stepScope, `최소 이동 표기 ${step.path.optimalMoves} ≠ 실제 ${optimal}.`)
      }
      const check = checkDrawnPath(step.path, step.correct)
      if (!check.startsAtStart || !check.endsAtGoal || !check.connected || !check.avoidsBlocked) {
        fail(stepScope, '기준 경로가 격자 규칙을 지키지 않습니다.')
      }
      if (!check.isOptimal) {
        fail(stepScope, `기준 경로가 최단이 아닙니다(${check.moves}번 이동, 최소 ${optimal}번).`)
      }
    }

    if (step.type === 'state_trace') {
      const stages = step.states?.stages ?? []
      if (stages.length === 0) fail(stepScope, '추적 단계가 없습니다.')
      stages.forEach((stage, index) => {
        if (!stage.options.some((option) => option.id === stage.correctId)) {
          fail(stepScope, `${index + 1}단계 정답이 보기 안에 없습니다.`)
        }
      })
      const expected = stages.map((stage) => stage.correctId)
      if (step.correct.join('|') !== expected.join('|')) {
        fail(stepScope, 'correct 배열이 단계별 정답과 일치하지 않습니다.')
      }
    }

    if (step.type === 'pattern_mark') {
      const tokens = step.pattern?.tokens ?? []
      const period = smallestPeriod(tokens)
      if (step.pattern && step.pattern.unitLength !== period) {
        fail(stepScope, `반복 단위 표기 ${step.pattern.unitLength} ≠ 실제 주기 ${period}.`)
      }
      if (step.correct.length !== period) {
        fail(stepScope, `correct 길이 ${step.correct.length} ≠ 주기 ${period}.`)
      }
    }

    if (step.type === 'network_select') {
      const network = step.network
      if (!network) {
        fail(stepScope, '네트워크 정보가 없습니다.')
        return
      }
      const ids = new Set([
        ...network.nodes.map((node) => node.id),
        ...network.edges.map((edge) => edge.id),
      ])
      step.correct.forEach((id) => {
        if (!ids.has(id)) fail(stepScope, `정답 ${id}가 네트워크에 없습니다.`)
      })
      network.edges.forEach((edge) => {
        const nodeIds = new Set(network.nodes.map((node) => node.id))
        if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
          fail(stepScope, `연결선 ${edge.id}가 없는 지점을 가리킵니다.`)
        }
      })
    }

    if (
      (step.type === 'multi_select' || step.type === 'error_spot' || step.type === 'step_order') &&
      step.correct.some((id) => !step.items.some((item) => item.id === id))
    ) {
      fail(stepScope, '정답 id가 항목 목록에 없습니다.')
    }
  })

  // 정답을 그대로 넣으면 만점이 나와야 합니다.
  const perfectAnswers = Object.fromEntries(problem.processSteps.map((step) => [step.id, step.correct]))
  const judged = judgeProblemProcess(problem, perfectAnswers)
  if (judged.total === 0) {
    fail(scope, '과정 증거 만점이 0점입니다. 채점 설정을 확인하세요.')
  } else if (judged.earned !== judged.total) {
    fail(scope, `정답을 넣었는데 만점이 아닙니다(${judged.earned}/${judged.total}).`)
  }

  const review = reviewProblem(problem)
  const blockers = review.findings.filter((finding) => finding.severity === 'blocker')
  blockers.forEach((finding) => fail(scope, `타당성 위반: ${finding.title}`))
  if (review.score < 80) {
    notes.push(`${scope}: 타당성 ${review.score}점 (경고 ${review.findings.length}건)`)
  }
}

problems.forEach((problem) => checkProblem(problem, `기본문제 ${problem.id}`))
starterPack.forEach((problem) => checkProblem(problem, `예시묶음 ${problem.id}`))

console.log(`검사한 문제: 기본 ${problems.length}개, 예시 묶음 ${starterPack.length}개`)
if (notes.length > 0) {
  console.log('\n참고 사항:')
  notes.forEach((note) => console.log(`  - ${note}`))
}

rmSync(workDir, { recursive: true, force: true })

if (failures.length > 0) {
  console.error(`\n실패 ${failures.length}건:`)
  failures.forEach((line) => console.error(`  × ${line}`))
  process.exit(1)
}
console.log('\n모든 문제 데이터 검사를 통과했습니다.')
