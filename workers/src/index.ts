import { AutoRouter, IRequest } from 'itty-router'
import { handleAuthNonce, handleAuthVerify } from './auth'
import {
  handlePostPlan,
  handlePostPlanConfirm,
  handleGetPlan,
  handleGetPlans,
  handleCancelPlan,
} from './routes/plans'
import { handlePostOutcome, handleGetOutcomes, handleGetOutcomesByOwner } from './routes/outcomes'
import { handleGetUser, handlePutUser } from './routes/users'
import { handleGetActivity, handlePostEvent } from './routes/activity'
import { handlePostUploadUrls } from './routes/images'
import { handleGetAnalytics } from './routes/analytics'
import { handleCron } from './cron-handler'

interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  JWT_SECRET: string
  CORS_ORIGIN: string
}

function addCorsHeaders(response: Response, request: IRequest): Response {
  const origin = request.headers.get('origin') || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

const router = AutoRouter<IRequest, [Env, ExecutionContext]>({
  before: [(req: IRequest) => {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.get('origin') || '*'
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
  }],
  finally: [(r: Response, req: IRequest) => addCorsHeaders(r, req)],
})

// Auth
router.get('/api/auth/nonce', (req, env) => handleAuthNonce(req, env.DB))
router.post('/api/auth/verify', (req, env) =>
  handleAuthVerify(req, env as unknown as { DB: D1Database; JWT_SECRET: string }),
)

// Plans
router.post('/api/plans', (req, env) => handlePostPlan(req, env))
router.post('/api/plans/:hash/confirm', (req, env) => handlePostPlanConfirm(req, env))
router.post('/api/plans/:hash/cancel', (req, env) => handleCancelPlan(req, env))
router.get('/api/plans/:hash', (req, env) => handleGetPlan(req, env))
router.get('/api/plans', (req, env) => handleGetPlans(req, env))

// Outcomes
router.post('/api/plans/:hash/outcomes', (req, env) => handlePostOutcome(req, env))
router.get('/api/plans/:hash/outcomes', (req, env) => handleGetOutcomes(req, env))
router.get('/api/outcomes', (req, env) => handleGetOutcomesByOwner(req, env))

// Analytics
router.get('/api/analytics', (req, env) => handleGetAnalytics(req, env))

// Users
router.get('/api/users/:address', (req, env) => handleGetUser(req, env))
router.put('/api/users/me', (req, env) => handlePutUser(req, env))

// Activity
router.get('/api/activity', (req, env) => handleGetActivity(req, env))
router.post('/api/events', (req, env) => handlePostEvent(req, env))

// Images
router.post('/api/images/upload-urls', (req, env) => handlePostUploadUrls(req, env))

// Serve R2 images
router.get('/images/*', async (req, env) => {
  const url = new URL(req.url)
  const key = url.pathname.replace('/images/', '')
  const object = await env.IMAGES.get(key)
  if (!object) return new Response('Not found', { status: 404 })
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
})

// Health check
router.get('/api/health', () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  }),
)

router.all('*', () =>
  new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }),
)

export default router
export { handleCron as scheduled }
