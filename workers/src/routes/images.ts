import { IRequest } from 'itty-router'
import { requireAuth } from '../auth'

export async function handlePostUploadUrls(
  request: IRequest,
  env: { IMAGES: R2Bucket; JWT_SECRET: string },
): Promise<Response> {
  const ownerId = await requireAuth(request, env)
  if (!ownerId)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { count = 1 } = (await request.json()) as { count?: number }

  const urls: { uploadUrl: string; publicUrl: string }[] = []
  for (let i = 0; i < Math.min(count, 10); i++) {
    const key = `${ownerId}/${crypto.randomUUID()}.png`
    const publicUrl = `${new URL(request.url).origin}/images/${key}`
    urls.push({ uploadUrl: publicUrl, publicUrl })
  }

  return new Response(JSON.stringify({ urls }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
