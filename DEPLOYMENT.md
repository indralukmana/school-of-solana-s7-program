# Deployment Guide

## Prerequisites

- Node.js 18+ with pnpm
- Solana CLI (`solana --version`)
- Anchor 0.31+ (`anchor --version`)
- Cloudflare account with Wrangler authenticated (`npx wrangler whoami`)
- Rust toolchain (`cargo`, `rustc`)

## Program Deployment (Solana)

### 1. Build the program

```bash
pnpm build:program
```

This runs `anchor build` and copies IDL + types to `frontend/src/lib/anchor-dist/`.

### 2. Deploy to devnet

```bash
cd anchor_project
anchor deploy --provider.cluster devnet
```

Note the program ID from the output. Update it in:
- `anchor_project/programs/plan-vault/src/lib.rs` → `declare_id!("...")`
- `frontend/src/lib/anchor-dist/idl/plan_vault.json` → `"address"` field

### 3. Rebuild after ID change

```bash
pnpm build:program
```

### 4. Run tests

```bash
pnpm test:program
```

Expect 26 tests passing against local validator.

## Workers API (Cloudflare)

### 1. Install dependencies

```bash
cd workers
pnpm install
```

### 2. Create D1 database (first time only)

```bash
npx wrangler d1 create plan-vault-db
```

Copy the returned `database_id` into `workers/wrangler.toml` under `[[d1_databases]]`.

### 3. Create R2 bucket (first time only)

```bash
npx wrangler r2 bucket create plan-vault-images
```

### 4. Set secrets

```bash
# Generate a random JWT secret
npx wrangler secret put JWT_SECRET
# Paste: $(openssl rand -hex 32)
```

### 5. Apply database schema

```bash
# Remote (production):
npx wrangler d1 execute plan-vault-db --remote --file=src/schema.sql

# Local (development):
pnpm db:local
```

### 6. Deploy

```bash
npx wrangler deploy
```

The worker URL will be printed. Example: `https://plan-vault-api.<subdomain>.workers.dev`

### 7. Verify

```bash
curl -s https://<worker-url>/api/health
# → {"ok":true}
```

## Frontend (Vercel)

### 1. Set environment variables

In Vercel dashboard or `.env.local`:

```
NEXT_PUBLIC_API_URL=https://plan-vault-api.<subdomain>.workers.dev
```

### 2. Build and deploy

```bash
pnpm build:frontend
```

Or push to connected Git repo — Vercel auto-deploys.

### 3. Verify

Visit the deployed URL. Connect wallet → create vault → deposit SOL → submit plan → check activity page.

## Environment Summary

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend `.env.local` | Workers API base URL |
| `JWT_SECRET` | Workers secret | HMAC-SHA256 key for JWT signing |
| `CORS_ORIGIN` | Workers `wrangler.toml` vars | Allowed frontend origin |
| Program ID | `lib.rs` + IDL JSON | On-chain program address |

## Cron Setup

The cron handler is exported as `scheduled` in the Worker. Enable it in `wrangler.toml`:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

This reconciles missed on-chain events every 5 minutes. Requires a paid Workers plan ($5/mo).

## Troubleshooting

**Build fails with IDL type errors:** Run `pnpm build:program` to regenerate IDL and types.

**Worker returns 500:** Check Cloudflare logs: `npx wrangler tail`.

**Auth returns "Missing required fields: cluster":** Ensure SIWS message includes `.cluster('devnet')`.

**D1 schema not applied:** Run `npx wrangler d1 execute plan-vault-db --remote --file=src/schema.sql` again.

**Tests fail after program changes:** Run `anchor build` first, then `anchor test`. Tests use the compiled IDL.
