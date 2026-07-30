#!/usr/bin/env node
/**
 * .env.local 값으로 Supabase 연결을 확인합니다.
 *
 *   npm run verify:supabase
 *
 * curl에 의존하지 않고 Node.js의 fetch만 사용합니다.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(projectRoot, '.env.local')

function say(line = '') {
  process.stdout.write(`${line}\n`)
}

function fail(lines) {
  say()
  lines.forEach((line) => say(line))
  say()
  process.exitCode = 1
}

if (!existsSync(envPath)) {
  fail([
    '[오류] .env.local 파일이 없습니다.',
    '먼저 npm run setup:supabase 를 실행하세요.',
    'Windows에서는 setup-supabase-easy.cmd 를 두 번 눌러도 됩니다.',
  ])
} else {
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }

  const url = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

  if (!url || !key) {
    fail([
      '[오류] .env.local 안의 값이 비어 있습니다.',
      `VITE_SUPABASE_URL: ${url || '없음'}`,
      `VITE_SUPABASE_PUBLISHABLE_KEY: ${key ? '있음' : '없음'}`,
    ])
  } else if (/^sb_secret_/i.test(key) || /service_role/i.test(key)) {
    fail([
      '[위험] Secret 또는 service_role 키가 .env.local에 들어 있습니다.',
      '이 키는 브라우저로 전달되므로 즉시 Supabase에서 폐기하고',
      'Publishable key(sb_publishable_...)로 바꿔 주세요.',
    ])
  } else {
    say(`프로젝트: ${url}`)
    say('연결을 확인합니다…')

    let response
    try {
      response = await fetch(`${url}/rest/v1/rpc/get_backend_status`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      })
    } catch (error) {
      fail([
        '[실패] 서버에 연결하지 못했습니다.',
        error instanceof Error ? `  ${error.message}` : '',
        '  인터넷 연결과 Project Ref를 확인하세요.',
      ])
      process.exit()
    }

    const text = await response.text()
    if (!response.ok) {
      const hints =
        response.status === 404
          ? ['  SQL Editor에서 supabase/schema.sql 을 아직 실행하지 않은 상태입니다.']
          : response.status === 401 || response.status === 403
            ? ['  Publishable key가 이 프로젝트의 값인지 확인하세요.']
            : []
      fail([`[실패] 서버가 ${response.status} 응답을 보냈습니다.`, `  ${text.slice(0, 300)}`, ...hints])
    } else {
      let version = ''
      try {
        version = JSON.parse(text)?.schema_version ?? ''
      } catch {
        version = ''
      }
      say()
      say(`[성공] Supabase 백엔드에 연결되었습니다. 스키마 ${version || '버전 확인'}`)
      say('npm run dev 로 실행한 뒤 교사 대시보드 > 서버 배포에서 로그인하세요.')
      say()
    }
  }
}
