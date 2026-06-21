import { IRequest } from 'itty-router'
import { requireAuth } from '../auth'
import { toCamelCase } from '../helpers'

interface Env {
  DB: D1Database
  JWT_SECRET: string
  SOLANA_RPC?: string
}

export async function handlePostPlan(request: IRequest, env: Env): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const body = (await request.json()) as {
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

  const contentObj = {
    contentUri: body.contentUri,
    description: body.description ?? '',
    imageUrls: body.imageUrls ?? [],
    investmentLamports: body.investmentLamports ?? 0,
    ownerId,
    riskLevel: body.riskLevel ?? '',
    stopLossBps: body.stopLossBps ?? 0,
    tags: body.tags ?? [],
    ticker: body.ticker ?? '',
    title: body.title,
    tradingPlatform: body.tradingPlatform ?? '',
    takeProfitBps: body.takeProfitBps ?? 0,
    vaultAddress: body.vaultAddress,
  }

  const contentJson = JSON.stringify(contentObj)
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentJson))
  const contentHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  await env.DB.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').bind(ownerId).run()
  await env.DB.prepare(
    `INSERT INTO plans (id, vault_address, owner_id, title, description, trading_platform,
     risk_level, ticker, investment_lamports, stop_loss_bps, take_profit_bps,
     tags, image_urls, content_hash, content_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      contentHash,
      body.vaultAddress,
      ownerId,
      body.title,
      body.description ?? '',
      body.tradingPlatform ?? '',
      body.riskLevel ?? '',
      body.ticker ?? '',
      body.investmentLamports ?? 0,
      body.stopLossBps ?? 0,
      body.takeProfitBps ?? 0,
      JSON.stringify(body.tags ?? []),
      JSON.stringify(body.imageUrls ?? []),
      contentHash,
      body.contentUri,
    )
    .run()

  return new Response(JSON.stringify({ id: contentHash, contentHash }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handlePostPlanConfirm(request: IRequest, env: Env): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const planHash = request.params.hash
  const { signature } = (await request.json()) as { signature: string }

  const plan = await env.DB.prepare(
    'SELECT * FROM plans WHERE id = ? AND owner_id = ?',
  )
    .bind(planHash, ownerId)
    .first()
  if (!plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 })

  await env.DB.prepare(
    "UPDATE plans SET onchain_tx = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(signature, planHash)
    .run()

  await env.DB.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').bind(ownerId).run()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO activity_events (id, event_type, actor_id, vault_address, plan_id, signature, metadata)
     VALUES (?, 'plan_submitted', ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      ownerId,
      plan.vault_address as string,
      planHash,
      signature,
      JSON.stringify({ title: plan.title as string }),
    )
    .run()

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleGetPlan(request: IRequest, env: { DB: D1Database }): Promise<Response> {
  const planHash = request.params.hash
  const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(planHash).first()
  if (!plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 })
  return new Response(JSON.stringify(toCamelCase(plan as Record<string, unknown>)), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleGetPlans(request: IRequest, env: { DB: D1Database }): Promise<Response> {
  const url = new URL(request.url)
  const owner = url.searchParams.get('owner')
  const tag = url.searchParams.get('tag')

  let query = 'SELECT * FROM plans WHERE 1=1'
  const params: string[] = []

  if (owner) {
    query += ' AND owner_id = ?'
    params.push(owner)
  }
  if (tag) {
    query += ' AND tags LIKE ?'
    params.push(`%"${tag}"%`)
  }
  query += ' ORDER BY created_at DESC LIMIT 50'

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all()
  return new Response(JSON.stringify((results as Record<string, unknown>[]).map(toCamelCase)), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleCancelPlan(request: IRequest, env: Env): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const planHash = request.params.hash

  const plan = await env.DB.prepare(
    'SELECT * FROM plans WHERE id = ? AND owner_id = ? AND cancelled = 0',
  )
    .bind(planHash, ownerId)
    .first()
  if (!plan) return new Response(JSON.stringify({ error: 'Plan not found or already cancelled' }), { status: 404 })

  await env.DB.prepare(
    "UPDATE plans SET cancelled = 1, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(planHash)
    .run()

  await env.DB.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').bind(ownerId).run()
  await env.DB.prepare(
    `INSERT INTO activity_events (id, event_type, actor_id, vault_address, plan_id, metadata)
     VALUES (?, 'plan_cancelled', ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      ownerId,
      plan.vault_address as string,
      planHash,
      JSON.stringify({ title: plan.title as string }),
    )
    .run()

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
