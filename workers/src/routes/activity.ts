import { IRequest } from 'itty-router'
import { toCamelCase } from '../helpers'

export async function handleGetActivity(
  request: IRequest,
  env: { DB: D1Database },
): Promise<Response> {
  const url = new URL(request.url)
  const actor = url.searchParams.get('actor')
  const vault = url.searchParams.get('vault')
  const before = url.searchParams.get('before')

  let query = 'SELECT * FROM activity_events WHERE 1=1'
  const params: string[] = []

  if (actor) {
    query += ' AND actor_id = ?'
    params.push(actor)
  }
  if (vault) {
    query += ' AND vault_address = ?'
    params.push(vault)
  }
  if (before) {
    query += ' AND created_at < ?'
    params.push(before)
  }
  query += ' ORDER BY created_at DESC LIMIT 50'

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all()
  return new Response(JSON.stringify((results as Record<string, unknown>[]).map(toCamelCase)), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handlePostEvent(
  request: IRequest,
  env: { DB: D1Database; JWT_SECRET: string; CORS_ORIGIN?: string },
): Promise<Response> {
  const { eventType, actorId, vaultAddress, planId, signature, metadata } =
    (await request.json()) as {
      eventType: string
      actorId: string
      vaultAddress?: string
      planId?: string
      signature?: string
      metadata?: string
    }

  const eventId = crypto.randomUUID()
  await env.DB.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').bind(actorId).run()
  await env.DB.prepare(
    `INSERT OR IGNORE INTO activity_events (id, event_type, actor_id, vault_address, plan_id, signature, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      eventId,
      eventType,
      actorId,
      vaultAddress ?? null,
      planId ?? null,
      signature ?? null,
      metadata ?? null,
    )
    .run()

  return new Response(JSON.stringify({ id: eventId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
