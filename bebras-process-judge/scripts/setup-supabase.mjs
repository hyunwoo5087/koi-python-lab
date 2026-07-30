#!/usr/bin/env node
/**
 * Supabase 연결 설정 도우미입니다.
 *
 * PowerShell, Supabase CLI, curl에 의존하지 않고 Node.js만 사용합니다.
 * Windows, macOS, Linux에서 같은 방식으로 동작합니다.
 *
 *   npm run setup:supabase
 *
 * 물어보지 않고 바로 설정하려면:
 *   node scripts/setup-supabase.mjs --ref=abcdefghijklm --key=sb_publishable_xxx --yes
 */
import { createInterface } from 'node:readline/promises'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stdin, stdout } from 'node:process'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(projectRoot, '.env.local')
const schemaPath = join(projectRoot, 'supabase', 'schema.sql')
const logPath = join(projectRoot, 'supabase-setup.log')

const args = parseArgs(process.argv.slice(2))
const logLines = []

function log(line) {
  logLines.push(`[${new Date().toISOString()}] ${line}`)
}

function say(line = '') {
  stdout.write(`${line}\n`)
}

function flushLog() {
  try {
    writeFileSync(logPath, `${logLines.join('\n')}\n`, 'utf8')
  } catch {
    // 로그를 남기지 못해도 설정 자체는 계속합니다.
  }
}

function parseArgs(list) {
  const result = { yes: false }
  for (const item of list) {
    if (item === '--yes' || item === '-y') result.yes = true
    else if (item.startsWith('--ref=')) result.ref = item.slice(6).trim()
    else if (item.startsWith('--key=')) result.key = item.slice(6).trim()
  }
  return result
}

/** 사용자가 대시보드 주소를 그대로 붙여 넣어도 Project Ref를 찾아냅니다. */
function extractRef(input) {
  const value = input.trim().replace(/^['"]|['"]$/g, '')
  if (!value) return ''
  const fromApiUrl = /^https?:\/\/([a-z0-9-]+)\.supabase\.(?:co|in)/i.exec(value)
  if (fromApiUrl) return fromApiUrl[1]
  const fromDashboard = /supabase\.com\/dashboard\/project\/([a-z0-9-]+)/i.exec(value)
  if (fromDashboard) return fromDashboard[1]
  return value.replace(/\/.*$/, '')
}

function cleanKey(input) {
  return input.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '')
}

function checkKey(key) {
  if (!key) return '키를 입력해야 합니다.'
  if (/^sb_secret_/i.test(key) || /service_role/i.test(key)) {
    return 'Secret 또는 service_role 키는 브라우저 앱에 쓸 수 없습니다. Publishable key를 사용하세요.'
  }
  if (!/^sb_publishable_/i.test(key) && !/^eyJ/.test(key)) {
    return '형식이 Publishable key(sb_publishable_...)와 다릅니다. 다시 확인해 주세요.'
  }
  return ''
}

/** 클립보드 복사와 브라우저 열기는 실패해도 설정을 막지 않습니다. */
function runQuietly(command, commandArgs, input) {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, commandArgs, { stdio: input ? ['pipe', 'ignore', 'ignore'] : 'ignore' })
      child.on('error', () => resolve(false))
      child.on('close', (code) => resolve(code === 0))
      if (input && child.stdin) {
        child.stdin.end(input)
      }
    } catch {
      resolve(false)
    }
  })
}

async function copyToClipboard(text) {
  if (process.platform === 'win32') {
    return runQuietly(process.env.COMSPEC || 'cmd.exe', ['/c', 'clip'], text)
  }
  if (process.platform === 'darwin') return runQuietly('pbcopy', [], text)
  if (await runQuietly('wl-copy', [], text)) return true
  return runQuietly('xclip', ['-selection', 'clipboard'], text)
}

async function openInBrowser(url) {
  if (process.platform === 'win32') {
    return runQuietly(process.env.COMSPEC || 'cmd.exe', ['/c', 'start', '', url])
  }
  if (process.platform === 'darwin') return runQuietly('open', [url])
  return runQuietly('xdg-open', [url])
}

async function verify(projectUrl, key) {
  const endpoint = `${projectUrl}/rest/v1/rpc/get_backend_status`
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const text = await response.text()
    if (!response.ok) {
      return { ok: false, status: response.status, body: text.slice(0, 400) }
    }
    let version = ''
    try {
      version = JSON.parse(text)?.schema_version ?? ''
    } catch {
      version = ''
    }
    return { ok: true, status: response.status, version, body: text.slice(0, 200) }
  } catch (error) {
    return { ok: false, status: 0, body: error instanceof Error ? error.message : String(error) }
  }
}

function explainFailure(result) {
  if (result.status === 0) {
    return [
      '서버에 연결하지 못했습니다.',
      '- 인터넷 연결과 학교 방화벽을 확인하세요.',
      '- Project Ref를 잘못 입력하면 존재하지 않는 주소가 됩니다.',
    ]
  }
  if (result.status === 401 || result.status === 403) {
    return [
      'Publishable key가 이 프로젝트의 것이 아니거나 권한이 없습니다.',
      '- Supabase의 Settings > API Keys에서 키를 다시 복사하세요.',
      '- Project Ref와 키가 같은 프로젝트의 값인지 확인하세요.',
    ]
  }
  if (result.status === 404) {
    return [
      'get_backend_status 함수를 찾을 수 없습니다. 아직 스키마를 실행하지 않은 상태입니다.',
      '- SQL Editor에 supabase/schema.sql 전체를 붙여 넣고 Run을 눌러 주세요.',
    ]
  }
  return [`서버가 ${result.status} 응답을 보냈습니다.`, result.body]
}

/**
 * 질문을 받습니다.
 * 터미널에서는 readline을 쓰고, 파이프로 값을 넘긴 경우에는 미리 읽어 둔 줄을 씁니다.
 * 더 답할 것이 없으면 null을 돌려줍니다.
 */
async function createPrompter(hasAllArgs) {
  if (hasAllArgs) {
    return { canAsk: false, ask: async () => null, close: () => {} }
  }
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout })
    return {
      canAsk: true,
      ask: (question) => rl.question(question),
      close: () => rl.close(),
    }
  }
  const chunks = []
  for await (const chunk of stdin) chunks.push(chunk)
  const lines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/)
  let cursor = 0
  return {
    canAsk: lines.length > 0,
    ask: async (question) => {
      if (cursor >= lines.length) return null
      const answer = lines[cursor]
      cursor += 1
      stdout.write(`${question}${answer}\n`)
      return answer
    },
    close: () => {},
  }
}

async function main() {
  log(`setup started on ${process.platform} node ${process.version}`)
  say()
  say('============================================================')
  say('  비버 사고과정 온라인 저지 - Supabase 설정')
  say('============================================================')
  say()
  say('PowerShell과 Supabase CLI를 사용하지 않습니다.')
  say('Supabase SQL Editor에 스키마를 붙여 넣는 가장 안정적인 방식입니다.')
  say()

  if (!existsSync(schemaPath)) {
    say('[오류] supabase/schema.sql 파일을 찾을 수 없습니다.')
    say('압축을 풀지 않고 실행했거나 폴더 구조가 바뀐 경우입니다.')
    log('schema.sql missing')
    flushLog()
    process.exitCode = 1
    return
  }

  const prompter = await createPrompter(Boolean(args.ref && args.key))

  try {
    let ref = extractRef(args.ref ?? '')
    let refTries = 0
    while (!ref && refTries < 5) {
      refTries += 1
      const answer = await prompter.ask('Supabase Project Ref (또는 프로젝트 주소 전체): ')
      if (answer === null) {
        say('[오류] Project Ref를 입력해야 합니다.')
        say('  대화형으로 실행하거나 --ref=프로젝트REF 형태로 값을 넘겨 주세요.')
        process.exitCode = 1
        return
      }
      ref = extractRef(answer)
      if (!ref) say('  비워 둘 수 없습니다.')
    }
    if (!ref) {
      say('[오류] Project Ref를 확인하지 못했습니다.')
      process.exitCode = 1
      return
    }

    let key = cleanKey(args.key ?? '')
    let keyProblem = checkKey(key)
    let keyTries = 0
    while (keyProblem && keyTries < 5) {
      keyTries += 1
      if (key) say(`  ${keyProblem}`)
      const answer = await prompter.ask('Publishable key (sb_publishable_...): ')
      if (answer === null) {
        say(`[오류] ${keyProblem}`)
        say('  대화형으로 실행하거나 --key=sb_publishable_... 형태로 값을 넘겨 주세요.')
        process.exitCode = 1
        return
      }
      key = cleanKey(answer)
      keyProblem = checkKey(key)
    }
    if (keyProblem) {
      say(`[오류] ${keyProblem}`)
      process.exitCode = 1
      return
    }

    const projectUrl = `https://${ref}.supabase.co`
    say()
    say(`프로젝트 주소: ${projectUrl}`)

    if (existsSync(envPath) && !args.yes && prompter.canAsk) {
      const current = readFileSync(envPath, 'utf8').trim()
      say()
      say('.env.local 파일이 이미 있습니다. 현재 값:')
      say(
        current
          .split('\n')
          .map((line) => `  ${line.replace(/(=.{0,12}).*/, '$1…')}`)
          .join('\n'),
      )
      const answer = (await prompter.ask('덮어쓸까요? (y/N): ')) ?? 'n'
      if (!/^y(es)?$/i.test(answer.trim())) {
        say('설정을 중단했습니다. 기존 .env.local을 그대로 둡니다.')
        log('aborted by user, env kept')
        flushLog()
        return
      }
    }

    writeFileSync(
      envPath,
      [
        '# 이 파일은 setup-supabase 스크립트가 만들었습니다.',
        '# 브라우저에는 Publishable key만 사용합니다. Secret key는 절대 넣지 마세요.',
        `VITE_SUPABASE_URL=${projectUrl}`,
        `VITE_SUPABASE_PUBLISHABLE_KEY=${key}`,
        '',
      ].join('\n'),
      'utf8',
    )
    say()
    say('[1/3] .env.local 파일을 만들었습니다.')
    log('.env.local written')

    const schema = readFileSync(schemaPath, 'utf8')
    const copied = await copyToClipboard(schema)
    say(
      copied
        ? '[2/3] 데이터베이스 스키마 SQL을 클립보드에 복사했습니다.'
        : `[2/3] 클립보드 복사에 실패했습니다. 아래 파일을 열어 전체를 복사하세요:\n      ${schemaPath}`,
    )
    log(`clipboard copy: ${copied}`)

    const sqlEditorUrl = `https://supabase.com/dashboard/project/${ref}/sql/new`
    say()
    say('다음 순서로 진행하세요.')
    say(`  1. SQL Editor를 엽니다: ${sqlEditorUrl}`)
    say(`  2. 편집창에 ${copied ? 'Ctrl+V(붙여넣기)로 붙여 넣습니다' : 'schema.sql 내용을 붙여 넣습니다'}.`)
    say('  3. 오른쪽 아래 Run 버튼을 누릅니다.')
    say('  4. Success가 표시되면 이 창으로 돌아옵니다.')
    say()
    await openInBrowser(sqlEditorUrl)

    if (prompter.canAsk) {
      await prompter.ask('Run을 마쳤으면 Enter를 누르세요… ')
    }

    say()
    say('[3/3] Supabase 연결을 확인합니다…')
    const result = await verify(projectUrl, key)
    log(`verify status=${result.status} ok=${result.ok}`)

    if (!result.ok) {
      say()
      say('[실패] 스키마 확인에 실패했습니다.')
      explainFailure(result).forEach((line) => say(`  ${line}`))
      say()
      say(`자세한 기록: ${logPath}`)
      flushLog()
      process.exitCode = 1
      return
    }

    say(`      스키마 버전 ${result.version || '확인'} 응답을 받았습니다.`)
    say()
    say('============================================================')
    say('  Supabase 설정이 완료되었습니다.')
    say('============================================================')
    say()
    say('이제 다음 명령으로 실행하세요.')
    say('  npm run dev')
    say()
    say('교사 대시보드 > 서버 배포에서 교사 계정을 만든 뒤 과제를 게시하세요.')
    say('연결 상태는 그 화면의 "연결 진단"에서 언제든 다시 확인할 수 있습니다.')
    say()
    log('setup completed')
    flushLog()
  } finally {
    prompter.close()
  }
}

await main()
