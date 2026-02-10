const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://plan-vault-api.workers.dev'

let cachedToken: string | null = null

export function setToken(token: string | null) {
  cachedToken = token
}

export function getToken(): string | null {
  return cachedToken
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (cachedToken) {
    headers['Authorization'] = `Bearer ${cachedToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error || res.statusText)
  }
  return res.json() as T
}

// Auth
export async function getAuthNonce(address: string) {
  return apiFetch<{ nonce: string; message: string }>(`/api/auth/nonce?address=${address}`)
}

export async function verifyAuth(address: string, message: string, signature: string) {
  const res = await apiFetch<{ token: string }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ address, message, signature }),
  })
  setToken(res.token)
  return res
}

// Plans
export interface PlanContent {
  title: string
  description?: string
  tradingPlatform?: string
  riskLevel?: string
  ticker?: string
  investmentLamports?: number
  stopLossBps?: number
  takeProfitBps?: number
  tags?: string[]
  imageUrls?: string[]
  vaultAddress: string
  contentUri: string
}

export interface PlanRecord extends PlanContent {
  id: string
  contentHash: string
  ownerId: string
  onchainTx?: string
  createdAt: string
}

export async function createPlan(plan: PlanContent) {
  return apiFetch<{ id: string; contentHash: string }>('/api/plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
}

export async function confirmPlan(planHash: string, signature: string) {
  return apiFetch<{ ok: boolean }>(`/api/plans/${planHash}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ signature }),
  })
}

export async function getPlan(planHash: string) {
  return apiFetch<PlanRecord>(`/api/plans/${planHash}`)
}

export async function getPlans(filter?: { owner?: string; tag?: string }) {
  const params = new URLSearchParams()
  if (filter?.owner) params.set('owner', filter.owner)
  if (filter?.tag) params.set('tag', filter.tag)
  return apiFetch<PlanRecord[]>(`/api/plans?${params.toString()}`)
}

// Outcomes
export interface Outcome {
  id: string
  planId: string
  ownerId: string
  pnlLamports: number | null
  notes: string
  screenshotUrls: string | null
  settledAt: string | null
  createdAt: string
}

export async function addOutcome(
  planHash: string,
  outcome: {
    pnlLamports?: number
    notes?: string
    screenshotUrls?: string[]
    settledAt?: string
  },
) {
  return apiFetch<{ id: string }>(`/api/plans/${planHash}/outcomes`, {
    method: 'POST',
    body: JSON.stringify(outcome),
  })
}

export async function getOutcomes(planHash: string) {
  return apiFetch<Outcome[]>(`/api/plans/${planHash}/outcomes`)
}

// Analytics
export interface AnalyticsResponse {
  totalPnlLamports: number
  profitFactor: number | null
  winRate: number
  totalOutcomes: number
  outcomeMonths: Array<{ month: string; pnlLamports: number; count: number }>
  tickerStats: Array<{ ticker: string; pnlLamports: number; count: number }>
}

export async function getAnalytics(owner: string) {
  return apiFetch<AnalyticsResponse>(`/api/analytics?owner=${owner}`)
}

// Outcomes by owner (for analytics drill-down)
export interface UserOutcome extends Outcome {
  planTitle: string
  ticker: string
  vaultAddress: string
}

export async function getOutcomesByOwner(owner: string, limit?: number, before?: string) {
  const params = new URLSearchParams({ owner })
  if (limit) params.set('limit', limit.toString())
  if (before) params.set('before', before)
  return apiFetch<UserOutcome[]>(`/api/outcomes?${params.toString()}`)
}

// Activity
export interface ActivityEvent {
  id: string
  eventType: string
  actorId: string
  vaultAddress: string | null
  planId: string | null
  signature: string | null
  metadata: string | null
  createdAt: string
}

export async function getActivity(filter?: { actor?: string; vault?: string; before?: string }) {
  const params = new URLSearchParams()
  if (filter?.actor) params.set('actor', filter.actor)
  if (filter?.vault) params.set('vault', filter.vault)
  if (filter?.before) params.set('before', filter.before)
  return apiFetch<ActivityEvent[]>(`/api/activity?${params.toString()}`)
}

export async function postEvent(event: {
  eventType: string
  actorId: string
  vaultAddress?: string
  planId?: string
  signature?: string
  metadata?: string
}) {
  return apiFetch<{ id: string }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

// R2 images
export async function getUploadUrls(count: number = 1) {
  return apiFetch<{ urls: { uploadUrl: string; publicUrl: string }[] }>('/api/images/upload-urls', {
    method: 'POST',
    body: JSON.stringify({ count }),
  })
}

export async function uploadImage(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!res.ok) throw new Error('Upload failed')
}
