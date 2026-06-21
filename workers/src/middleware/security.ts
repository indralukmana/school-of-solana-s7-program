/**
 * Security middleware: request body size limits,
 * content-type validation, and security headers.
 */

const MAX_BODY_SIZE = 100 * 1024 // 100 KB
const MAX_IMAGE_UPLOAD_BODY = 500 * 1024 // 500 KB for image upload requests

const ALLOWED_CONTENT_TYPES = ['application/json', 'text/plain']

export function enforceBodySizeLimit(request: Request, endpoint?: string): Response | null {
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
  const limit = endpoint === 'upload' ? MAX_IMAGE_UPLOAD_BODY : MAX_BODY_SIZE

  if (contentLength > limit) {
    return new Response(
      JSON.stringify({ error: 'Request body too large' }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  return null
}

export function enforceContentType(request: Request): Response | null {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null
  }

  const contentType = request.headers.get('content-type') || ''

  if (contentType.startsWith('multipart/form-data')) {
    return null
  }

  if (!ALLOWED_CONTENT_TYPES.some((t) => contentType.includes(t))) {
    return new Response(
      JSON.stringify({ error: 'Unsupported content type' }),
      {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  return null
}

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
