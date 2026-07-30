import { supabase, supabaseConfigured } from './supabaseClient'
import { checkBackendStatus } from './serverRepository'

/** 이 버전이 기대하는 데이터베이스 스키마 버전입니다. */
export const expectedSchemaVersion = '0.6.0'

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'skip'

export interface DiagnosticCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
  /** 실패했을 때 학교 현장에서 바로 따라할 수 있는 조치입니다. */
  fix?: string
}

export interface DiagnosticsResult {
  checks: DiagnosticCheck[]
  ranAt: string
  ok: boolean
}

/**
 * 앱에서 Supabase 연결 상태를 한 화면에서 점검합니다.
 * setup 스크립트가 실행되지 않는 환경에서도 어디까지 되었는지 알 수 있게 합니다.
 */
export async function runDiagnostics(): Promise<DiagnosticsResult> {
  const checks: DiagnosticCheck[] = []
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

  // 1. 환경 변수
  if (!url || !key) {
    checks.push({
      id: 'env',
      label: '환경 변수 .env.local',
      status: 'fail',
      detail: `${!url ? 'VITE_SUPABASE_URL' : ''}${!url && !key ? '와 ' : ''}${
        !key ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : ''
      } 값이 없습니다.`,
      fix: '프로젝트 폴더에 .env.local 파일을 만들고 두 줄을 넣은 뒤 npm run dev를 다시 실행하세요.',
    })
    return finish(checks)
  }
  checks.push({
    id: 'env',
    label: '환경 변수 .env.local',
    status: 'ok',
    detail: '두 값을 모두 읽었습니다.',
  })

  // 2. URL 형식
  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i
  const normalizedUrl = url.replace(/\/$/, '')
  if (!urlPattern.test(normalizedUrl)) {
    checks.push({
      id: 'url',
      label: '프로젝트 주소 형식',
      status: 'fail',
      detail: `현재 값: ${normalizedUrl}`,
      fix: 'https://프로젝트REF.supabase.co 형태여야 합니다. 대시보드 주소가 아니라 API URL을 넣으세요.',
    })
  } else {
    checks.push({
      id: 'url',
      label: '프로젝트 주소 형식',
      status: 'ok',
      detail: normalizedUrl,
    })
  }

  // 3. 키 종류 — 브라우저에는 Publishable key만 넣습니다.
  if (/^sb_secret_/i.test(key) || /service_role/i.test(key)) {
    checks.push({
      id: 'key',
      label: '키 종류',
      status: 'fail',
      detail: 'Secret 또는 service_role 키가 들어 있습니다.',
      fix: '지금 바로 이 키를 Supabase에서 폐기하고, Publishable key(sb_publishable_...)로 바꾸세요. 브라우저 코드에 들어간 키는 공개된 것으로 보아야 합니다.',
    })
  } else if (/^sb_publishable_/i.test(key)) {
    checks.push({
      id: 'key',
      label: '키 종류',
      status: 'ok',
      detail: 'Publishable key를 사용합니다.',
    })
  } else if (/^eyJ/.test(key)) {
    checks.push({
      id: 'key',
      label: '키 종류',
      status: 'warn',
      detail: '예전 방식의 anon 키로 보입니다. 동작하지만 곧 사용이 끝날 수 있습니다.',
      fix: 'Supabase의 API Keys 화면에서 새 Publishable key로 바꾸는 것을 권합니다.',
    })
  } else {
    checks.push({
      id: 'key',
      label: '키 종류',
      status: 'warn',
      detail: '알 수 없는 형식의 키입니다.',
      fix: 'Settings > API Keys에서 Publishable key를 다시 복사해 주세요.',
    })
  }

  if (!supabaseConfigured || !supabase) {
    checks.push({
      id: 'client',
      label: 'Supabase 클라이언트',
      status: 'fail',
      detail: '환경 변수를 읽었지만 클라이언트를 만들지 못했습니다.',
      fix: '개발 서버를 완전히 끄고 npm run dev로 다시 시작하세요. Vite는 .env.local을 시작할 때만 읽습니다.',
    })
    return finish(checks)
  }

  // 4. 데이터베이스 스키마
  let schemaVersion = ''
  try {
    const status = await checkBackendStatus()
    schemaVersion = status.schemaVersion
    checks.push({
      id: 'schema',
      label: '데이터베이스 스키마',
      status: 'ok',
      detail: `스키마 ${status.schemaVersion} · 서버 시각 ${status.serverTime || '확인'}`,
    })
  } catch (error) {
    const message = readError(error)
    checks.push({
      id: 'schema',
      label: '데이터베이스 스키마',
      status: 'fail',
      detail: message,
      fix: /not exist|찾지 못했|function/i.test(message)
        ? 'Supabase SQL Editor에서 supabase/schema.sql 전체를 붙여 넣고 Run을 눌러 주세요.'
        : 'Project Ref와 Publishable key가 같은 프로젝트의 값인지 확인하세요.',
    })
    return finish(checks)
  }

  // 5. 스키마 버전 비교
  if (compareVersion(schemaVersion, expectedSchemaVersion) < 0) {
    checks.push({
      id: 'schema-version',
      label: '스키마 버전',
      status: 'warn',
      detail: `서버 ${schemaVersion} · 이 앱이 기대하는 버전 ${expectedSchemaVersion}`,
      fix: 'supabase/schema.sql을 다시 실행하면 최신 상태가 됩니다. 이미 저장된 과제와 제출 기록은 지워지지 않습니다.',
    })
  } else {
    checks.push({
      id: 'schema-version',
      label: '스키마 버전',
      status: 'ok',
      detail: `서버 ${schemaVersion}`,
    })
  }

  // 6. 학생 접속 경로 — anon 권한으로 과제 조회 RPC가 열려 있는지 봅니다.
  try {
    const { error } = await supabase.rpc('get_published_set', { p_access_code: 'ZZZZ-CHECK' })
    if (error) throw error
    checks.push({
      id: 'student-rpc',
      label: '학생 과제 조회 권한',
      status: 'ok',
      detail: '학생용 RPC가 열려 있습니다. 없는 코드에는 빈 결과를 돌려줍니다.',
    })
  } catch (error) {
    checks.push({
      id: 'student-rpc',
      label: '학생 과제 조회 권한',
      status: 'fail',
      detail: readError(error),
      fix: 'schema.sql의 grant execute on function public.get_published_set(text) to anon 부분이 실행되었는지 확인하세요.',
    })
  }

  // 7. 교사 세션
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    checks.push({
      id: 'session',
      label: '교사 로그인',
      status: 'warn',
      detail: '아직 로그인하지 않았습니다.',
      fix: '아래에서 교사 계정을 만들거나 로그인하면 과제를 게시할 수 있습니다.',
    })
    checks.push({
      id: 'rls',
      label: '교사 데이터 접근(RLS)',
      status: 'skip',
      detail: '로그인 후 확인합니다.',
    })
    return finish(checks)
  }
  checks.push({
    id: 'session',
    label: '교사 로그인',
    status: 'ok',
    detail: sessionData.session.user.email ?? '교사 계정',
  })

  // 8. RLS로 내 과제만 보이는지
  try {
    const { error, count } = await supabase
      .from('published_sets')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    checks.push({
      id: 'rls',
      label: '교사 데이터 접근(RLS)',
      status: 'ok',
      detail: `내 계정으로 볼 수 있는 과제 ${count ?? 0}개`,
    })
  } catch (error) {
    checks.push({
      id: 'rls',
      label: '교사 데이터 접근(RLS)',
      status: 'fail',
      detail: readError(error),
      fix: 'schema.sql의 정책(policy) 부분이 모두 실행되었는지 확인하세요.',
    })
  }

  return finish(checks)
}

function finish(checks: DiagnosticCheck[]): DiagnosticsResult {
  return {
    checks,
    ranAt: new Date().toISOString(),
    ok: checks.every((check) => check.status === 'ok' || check.status === 'skip'),
  }
}

function compareVersion(left: string, right: string) {
  const parse = (value: string) => value.split('.').map((part) => Number(part) || 0)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function readError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return '알 수 없는 오류'
}
