# Plan Vault — Context

## Domain Glossary

| Term | Definition |
|------|-----------|
| **Vault** | A PDA account holding SOL as commitment. Created for a specific trading plan title. Locked until a plan is submitted. |
| **Plan** | A trading thesis: what asset, on what platform, risk parameters, and a markdown analysis. Stored off-chain in D1; only a content hash lives on-chain. |
| **Outcome** | Post-trade result: P&L, notes, screenshots. Entirely off-chain. |
| **Content Hash** | SHA-256 of the canonical JSON of a plan. Stored on-chain in the Plan PDA as an integrity proof. |
| **Activity Event** | A record of an action (vault created, deposit, plan submitted, etc.). Backfilled by frontend-notify on success; reconciled by cron. |
| **SIWS** | Sign-In With Solana — wallet-based authentication for the off-chain API. No passwords. |
| **Vault Status** | Locked (no plan yet) or Unlocked (plan submitted, SOL withdrawable). |

## Architecture

```
User Wallet ──sign tx──▶ Solana Program (on-chain)
    │                        │
    │                        │ stores: vault owner, status, SOL balance,
    │                        │         plan content_hash, plan content_uri
    │                        │
    ▼                        ▼ (webhook + cron reconciliation)
Cloudflare Workers API ──▶ D1 Database
    │                        │
    │ serves:                 │ stores: rich plan content, outcomes,
    │ plans, outcomes,        │         user profiles, activity feed,
    │ activity, users         │         auth nonces
    │                        │
    ▼                        ▼
 R2 Bucket                   (images: charts, screenshots)
```

## Data Flow: Submit Plan

1. User fills plan form (fields + markdown analysis + optional chart image)
2. Frontend uploads image to R2 via presigned URL → gets R2 URL
3. Frontend POSTs plan content to `/api/plans` → API hashes it, stores in D1, returns `content_hash`
4. Frontend calls `program.methods.submitPlan({ content_hash, content_uri })` on-chain
5. On confirm: frontend calls `/api/plans/:hash/confirm` → API marks plan as confirmed, creates activity event
6. Fallback: Worker cron scans program transactions every 5 min, backfills any missed events

## Component Responsibilities

### Solana Program (`anchor_project/programs/plan-vault/`)
- Instructions: `initialize_vault`, `deposit`, `submit_plan`, `withdraw`, `close_vault`
- Accounts: `VaultAccount` (owner, status, title, SOL), `Plan` (content_hash, content_uri)
- PDA seeds: vault = `[vault, sha256(title), owner]`, plan = `[plan, vault_pubkey]`

### Workers API (`workers/`)
- Auth: `GET /api/auth/nonce`, `POST /api/auth/verify` (SIWS → JWT)
- Plans: CRUD + confirm + search by owner/tag
- Outcomes: add trade result + list
- Activity: query feed, filter by actor/vault
- Users: get profile, update avatar
- Images: get presigned upload URLs, serve R2 objects
- Cron: reconcile missed on-chain events

### Frontend (`frontend/`)
- Next.js 15 App Router, shadcn/ui, TanStack React Query
- Pages: `/` (dashboard), `/vaults`, `/vaults/[address]`, `/activity`
- Lib: `api-client.ts` (Worker API), `plan-vault-program.ts` + `plan-vault-utils.ts` (Anchor)
- Hooks: one per instruction + API data hooks

### Database (D1)
- Tables: `users`, `plans`, `outcomes`, `activity_events`, `auth_nonces`
- `plans.content_hash` = SHA-256 hex; `plans.id` also the hash

## Key Decisions

- **Why hybrid?** Rich content (markdown, images, outcomes) is too expensive on-chain. The vault lock/unlock mechanism is the only part needing trustlessness.
- **Why content hash on-chain?** Proves the off-chain plan wasn't modified post-submission. Anyone can verify.
- **Why SIWS?** Wallet-native auth — users already have a wallet. Standardized message format.
- **Why Cloudflare?** D1 (serverless SQLite), R2 (cheap object storage), Workers (edge compute) — all under one platform, generous free tier.
