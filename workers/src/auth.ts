import { SiwsMessageBuilder, generateNonce, verifySignature } from '@siws/core'

export interface JwtPayload {
  sub: string
  iat: number
  exp: number
}

async function base64UrlEncode(data: Uint8Array): Promise<string> {
  const base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const enc = new TextEncoder()
  const headerB64 = await base64UrlEncode(new Uint8Array(enc.encode(JSON.stringify(header))))
  const payloadB64 = await base64UrlEncode(new Uint8Array(enc.encode(JSON.stringify(payload))))
  const toSign = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(toSign))
  const sigB64 = await base64UrlEncode(new Uint8Array(sig))
  return `${headerB64}.${payloadB64}.${sigB64}`
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(sigB64),
      enc.encode(`${headerB64}.${payloadB64}`),
    )
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as JwtPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function handleAuthNonce(request: Request, db: D1Database): Promise<Response> {
  const url = new URL(request.url)
  const address = url.searchParams.get('address')
  if (!address)
    return new Response(JSON.stringify({ error: 'Missing address' }), { status: 400 })

  const nonce = generateNonce()
  const message = new SiwsMessageBuilder()
    .domain(url.hostname)
    .address(address)
    .uri(`${url.origin}/api/auth/verify`)
    .nonce(nonce)
    .issuedAt(new Date())
    .statement('Sign in to Plan Vault')
    .cluster('devnet')
    .build()

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  await db
    .prepare('INSERT INTO auth_nonces (nonce, address, expires_at) VALUES (?, ?, ?)')
    .bind(nonce, address, expiresAt)
    .run()

  return new Response(JSON.stringify({ nonce, message: message.toMessage() }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleAuthVerify(
  request: Request,
  env: { DB: D1Database; JWT_SECRET: string },
): Promise<Response> {
  const { address, message, signature } = (await request.json()) as {
    address: string
    message: string
    signature: string
  }

  const result = await verifySignature(message, signature, address, {
    domain: new URL(request.url).hostname,
  })
  if (!result.success)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })

  const nonce = result.data!.nonce
  const stored = await env.DB.prepare(
    "SELECT nonce FROM auth_nonces WHERE nonce = ? AND address = ? AND expires_at > datetime('now')",
  )
    .bind(nonce, address)
    .first()
  if (!stored)
    return new Response(JSON.stringify({ error: 'Nonce expired' }), { status: 401 })

  await env.DB.prepare('DELETE FROM auth_nonces WHERE nonce = ?').bind(nonce).run()

  const thirtyMinutes = 30 * 60
  const payload: JwtPayload = {
    sub: address,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + thirtyMinutes,
  }
  const token = await signJwt(payload, env.JWT_SECRET)

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function requireAuth(
  request: Request,
  env: { JWT_SECRET: string },
): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const payload = await verifyJwt(token, env.JWT_SECRET)
  return payload?.sub ?? null
}
