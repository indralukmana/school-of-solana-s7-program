import { IRequest } from 'itty-router'
import { requireAuth } from '../auth'

export async function handleGetUser(
  request: IRequest,
  env: { DB: D1Database },
): Promise<Response> {
  const address = request.params.address
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(address).first()
  if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handlePutUser(
  request: IRequest,
  env: { DB: D1Database; JWT_SECRET: string },
): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { avatarUrl } = (await request.json()) as { avatarUrl?: string }
  await env.DB.prepare(
    "INSERT INTO users (id, avatar_url) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET avatar_url = ?, updated_at = datetime('now')",
  )
    .bind(ownerId, avatarUrl ?? null, avatarUrl ?? null)
    .run()

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
