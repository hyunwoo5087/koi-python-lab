import type { Attempt, Problem } from '../types'
import {
  getCurrentUser,
  getBackendStatus,
  requireSupabase,
  supabaseConfigured,
} from './supabaseClient'

export interface PublishedSet {
  id: string
  accessCode: string
  title: string
  problems: Problem[]
  isActive: boolean
  updatedAt: string
}

export interface ServerAttemptRecord {
  id: string
  publishedSetId: string
  accessCode: string
  nickname: string
  classCode: string
  completedAt: string
  attempt: Attempt
}

export interface BackendStatus {
  schemaVersion: string
  serverTime: string
}

export function isServerAvailable() {
  return supabaseConfigured
}

export async function checkBackendStatus(): Promise<BackendStatus> {
  const data = await getBackendStatus()
  if (!data?.schema_version) {
    throw new Error('Supabase 데이터베이스 스키마를 확인하지 못했습니다.')
  }
  return {
    schemaVersion: String(data.schema_version),
    serverTime: String(data.server_time ?? ''),
  }
}

export async function loadPublishedSet(accessCode: string): Promise<PublishedSet | null> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_published_set', {
    p_access_code: normalizeCode(accessCode),
  })
  if (error) throw error
  if (!data) return null

  const row = data as Record<string, unknown>
  const problems = Array.isArray(row.problems) ? (row.problems as Problem[]) : []
  if (problems.length === 0) return null

  return {
    id: String(row.id ?? ''),
    accessCode: String(row.access_code ?? accessCode),
    title: String(row.title ?? '비버 사고과정 과제'),
    problems,
    isActive: Boolean(row.is_active ?? true),
    updatedAt: String(row.updated_at ?? ''),
  }
}

export async function submitAttemptToServer(accessCode: string, attempt: Attempt) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('submit_published_attempt', {
    p_access_code: normalizeCode(accessCode),
    p_attempt: attempt,
  })
  if (error) throw error
  return String(data ?? '')
}

export async function publishProblemSet(params: {
  accessCode: string
  title: string
  problems: Problem[]
}) {
  const user = await getCurrentUser()
  const client = requireSupabase()
  const { data, error } = await client.rpc('upsert_published_set', {
    p_access_code: normalizeCode(params.accessCode),
    p_title: params.title.trim() || '비버 사고과정 과제',
    p_problem_snapshots: params.problems,
  })
  if (error) throw error
  if (!data) throw new Error('게시 결과를 확인하지 못했습니다.')

  const result = mapPublishedSet(data as Record<string, unknown>)
  if (!result.id || user.id.length === 0) {
    throw new Error('게시된 과제 정보를 확인하지 못했습니다.')
  }
  return result
}

export async function listMyPublishedSets(): Promise<PublishedSet[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('published_sets')
    .select('id,access_code,title,problem_snapshots,is_active,updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => mapPublishedSet(row as Record<string, unknown>))
}

export async function setPublishedSetActive(id: string, isActive: boolean) {
  const client = requireSupabase()
  const { error } = await client
    .from('published_sets')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deletePublishedSet(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('published_sets').delete().eq('id', id)
  if (error) throw error
}

export async function listMyServerAttempts(): Promise<ServerAttemptRecord[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('server_attempts')
    .select('id,published_set_id,access_code,nickname,class_code,completed_at,payload')
    .order('completed_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String(row.id),
    publishedSetId: String(row.published_set_id),
    accessCode: String(row.access_code),
    nickname: String(row.nickname),
    classCode: String(row.class_code),
    completedAt: String(row.completed_at),
    attempt: row.payload as unknown as Attempt,
  }))
}

function mapPublishedSet(row: Record<string, unknown>): PublishedSet {
  return {
    id: String(row.id ?? ''),
    accessCode: String(row.access_code ?? ''),
    title: String(row.title ?? ''),
    problems: Array.isArray(row.problem_snapshots) ? (row.problem_snapshots as Problem[]) : [],
    isActive: Boolean(row.is_active),
    updatedAt: String(row.updated_at ?? ''),
  }
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
