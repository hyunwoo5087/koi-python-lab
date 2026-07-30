import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const supabaseConfigured = Boolean(supabaseUrl && publishableKey)
export type ServerSession = Session
export type ServerUser = User

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-application-name': 'bebras-process-judge-v0.5',
        },
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
  }
  return supabase
}

export async function getStoredSession(): Promise<ServerSession | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function subscribeToAuthChanges(
  listener: (event: AuthChangeEvent, session: ServerSession | null) => void,
) {
  if (!supabase) return () => undefined
  const { data } = supabase.auth.onAuthStateChange(listener)
  return () => data.subscription.unsubscribe()
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('로그인 세션을 만들지 못했습니다.')
  return data.session
}

export async function signUp(email: string, password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const client = requireSupabase()
  const { data, error } = await client.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('교사 로그인이 필요합니다.')
  return data.user
}

export async function getBackendStatus() {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_backend_status')
  if (error) throw error
  return data as {
    schema_version?: string
    server_time?: string
  } | null
}
