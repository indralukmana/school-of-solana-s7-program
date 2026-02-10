import { IRequest } from 'itty-router'
import { requireAuth } from '../auth'

export async function handlePostOutcome(
  request: IRequest,
  env: { DB: D1Database; JWT_SECRET: string },
): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const planHash = request.params.hash
  const { pnlLamports, notes, screenshotUrls, settledAt } = (await request.json()) as {
    pnlLamports?: number
    notes?: string
    screenshotUrls?: string[]
    settledAt?: string
  }

  const plan = await env.DB.prepare('SELECT id, vault_address FROM plans WHERE id = ?')
    .bind(planHash)
    .first()
  if (!plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 })

  const outcomeId = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO outcomes (id, plan_id, owner_id, pnl_lamports, notes, screenshot_urls, settled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      outcomeId,
      planHash,
      ownerId,
      pnlLamports ?? null,
      notes ?? '',
      JSON.stringify(screenshotUrls ?? []),
      settledAt ?? null,
    )
    .run()

  await env.DB.prepare(
    `INSERT INTO activity_events (id, event_type, actor_id, vault_address, plan_id, metadata)
     VALUES (?, 'outcome_added', ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      ownerId,
      plan.vault_address as string,
      planHash,
      JSON.stringify({ pnlLamports: pnlLamports ?? null }),
    )
    .run()

  return new Response(JSON.stringify({ id: outcomeId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleGetOutcomes(
  request: IRequest,
  env: { DB: D1Database },
): Promise<Response> {
  const planHash = request.params.hash
  const { results } = await env.DB.prepare(
    'SELECT * FROM outcomes WHERE plan_id = ? ORDER BY created_at DESC',
  )
    .bind(planHash)
    .all()
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleGetOutcomesByOwner(
  request: IRequest,
  env: { DB: D1Database },
): Promise<Response> {
  const url = new URL(request.url)
  const owner = url.searchParams.get('owner')
  if (!owner) {
    return new Response(JSON.stringify({ error: 'owner query param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '', 10) || 20, 50)
  const before = url.searchParams.get('before')

  let query = `SELECT o.*, p.title AS plan_title, p.ticker, p.vault_address AS vault_address
     FROM outcomes o
     JOIN plans p ON o.plan_id = p.id
     WHERE p.owner_id = ?`
  const params: unknown[] = [owner]

  if (before) {
    query += ' AND o.created_at < ?'
    params.push(before)
  }

  query += ' ORDER BY o.created_at DESC LIMIT ?'
  params.push(limit)

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all()

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  })
}
