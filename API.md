# API Reference

Base URL: `https://plan-vault-api.indralukmana.workers.dev`

## Authentication

All endpoints except `/api/auth/*`, `/api/health`, and public GETs require `Authorization: Bearer <jwt>`.

### Get SIWS Challenge

```
GET /api/auth/nonce?address=<wallet_pubkey_base58>
```

Response:
```json
{
  "nonce": "abc123...",
  "message": "plan-vault-api...workers.dev wants you to sign in..."
}
```

### Verify Signature

```
POST /api/auth/verify
Content-Type: application/json

{
  "address": "<wallet_pubkey_base58>",
  "message": "<the SIWS message from /nonce>",
  "signature": "<base58-encoded ed25519 signature>"
}
```

Response:
```json
{ "token": "<jwt>" }
```

Set the `Authorization: Bearer <token>` header for subsequent requests. JWT expires in 30 minutes.

---

## Plans

### Create Plan (off-chain)

```
POST /api/plans
Authorization: Bearer <jwt>

{
  "title": "SOL breakout",
  "description": "Buying SOL at support level...",
  "tradingPlatform": "Jupiter",
  "riskLevel": "medium",
  "ticker": "SOL",
  "investmentLamports": 1000000000,
  "stopLossBps": 500,
  "takeProfitBps": 1500,
  "tags": ["swing", "SOL"],
  "imageUrls": ["https://..."],
  "vaultAddress": "<vault_pda_base58>",
  "contentUri": "https://api.../api/plans/placeholder"
}
```

Response (201):
```json
{
  "id": "a1b2c3...",        // SHA-256 hex of plan content
  "contentHash": "a1b2c3..."
}
```

The returned `contentHash` is used in the on-chain `submit_plan` instruction. Store it as `number[]` (32 bytes) when passing to the program.

### Confirm On-Chain Submission

```
POST /api/plans/:hash/confirm
Authorization: Bearer <jwt>

{
  "signature": "<on-chain tx signature>"
}
```

Response:
```json
{ "ok": true }
```

### Get Plan

```
GET /api/plans/:hash
```

Response (200):
```json
{
  "id": "a1b2c3...",
  "vaultAddress": "<base58>",
  "ownerId": "<base58>",
  "title": "SOL breakout",
  "description": "Buying SOL at support...",
  "tradingPlatform": "Jupiter",
  "riskLevel": "medium",
  "ticker": "SOL",
  "investmentLamports": 1000000000,
  "stopLossBps": 500,
  "takeProfitBps": 1500,
  "tags": "[\"swing\",\"SOL\"]",
  "imageUrls": "[\"https://...\"]",
  "contentHash": "a1b2c3...",
  "contentUri": "https://api.../api/plans/a1b2c3...",
  "onchainTx": "<tx sig or null>",
  "createdAt": "2026-06-19T17:00:00.000Z"
}
```

### List Plans

```
GET /api/plans?owner=<wallet_pubkey>&tag=swing
```

Returns plans sorted by `created_at DESC`, max 50.

---

## Outcomes

### Add Trade Outcome

```
POST /api/plans/:hash/outcomes
Authorization: Bearer <jwt>

{
  "pnlLamports": 50000000,
  "notes": "Hit take profit at ATH",
  "screenshotUrls": ["https://..."],
  "settledAt": "2026-06-20T10:00:00.000Z"
}
```

Response (201):
```json
{ "id": "<uuid>" }
```

### List Outcomes

```
GET /api/plans/:hash/outcomes
```

Response:
```json
[
  {
    "id": "<uuid>",
    "planId": "a1b2c3...",
    "ownerId": "<base58>",
    "pnlLamports": 50000000,
    "notes": "Hit take profit at ATH",
    "screenshotUrls": "[\"https://...\"]",
    "settledAt": "2026-06-20T10:00:00.000Z",
    "createdAt": "2026-06-20T10:05:00.000Z"
  }
]
```

---

## Activity

### Get Activity Feed

```
GET /api/activity?actor=<wallet_pubkey>&vault=<vault_pubkey>&before=<ISO timestamp>
```

All query params optional. Returns 50 events max.

Response:
```json
[
  {
    "id": "<uuid>",
    "eventType": "plan_submitted",
    "actorId": "<base58>",
    "vaultAddress": "<base58 or null>",
    "planId": "a1b2c3...",
    "signature": "<tx sig or null>",
    "metadata": "{\"title\":\"SOL breakout\"}",
    "createdAt": "2026-06-19T17:00:00.000Z"
  }
]
```

### Post Event (frontend-notify)

```
POST /api/events
Content-Type: application/json

{
  "eventType": "vault_created",
  "actorId": "<base58>",
  "vaultAddress": "<base58>",
  "signature": "<tx sig>",
  "metadata": "{\"title\":\"My Plan\"}"
}
```

No auth required. Idempotent via event ID. Used by frontend after on-chain confirmations.

---

## Users

### Get User Profile

```
GET /api/users/:wallet_pubkey
```

Response:
```json
{
  "id": "<base58>",
  "avatarUrl": "https://...",
  "createdAt": "2026-06-19T17:00:00.000Z"
}
```

### Update Avatar

```
PUT /api/users/me
Authorization: Bearer <jwt>

{
  "avatarUrl": "https://r2.../avatar.png"
}
```

Response:
```json
{ "ok": true }
```

---

## Images

### Get Upload URLs

```
POST /api/images/upload-urls
Authorization: Bearer <jwt>

{
  "count": 3
}
```

Response:
```json
{
  "urls": [
    { "uploadUrl": "https://.../images/<owner>/<uuid>.png", "publicUrl": "https://.../images/<owner>/<uuid>.png" }
  ]
}
```

Upload images by PUTting file bytes to `uploadUrl` with `Content-Type: image/png` (or jpeg/webp). Max 10 per request.

### Serve Image

```
GET /images/<owner>/<uuid>.png
```

Returns the image with `Cache-Control: public, max-age=31536000`.

---

## Health

```
GET /api/health
→ { "ok": true }
```

---

## Error Codes

All errors return `{ "error": "<message>" }` with appropriate HTTP status:

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing params, validation) |
| 401 | Unauthorized (invalid/missing JWT, bad signature, expired nonce) |
| 404 | Resource not found |
| 409 | Conflict (content hash mismatch on confirm) |
| 500 | Internal server error |
