# Plan Vault

Decentralized trading diary with a commitment vault on Solana. Create vaults for trading plans, deposit SOL as commitment, and withdraw only after submitting a detailed plan — enforcing a disciplined approach to trading.

**Frontend:** [plan-vault-ackee-program-task.vercel.app](https://plan-vault-ackee-program-task.vercel.app)  
**Program (Devnet):** `HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e` — [Solana Explorer](https://explorer.solana.com/address/HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e?cluster=devnet)  
**API:** `https://plan-vault-api.indralukmana.workers.dev`

> **Hybrid web2/web3 architecture.** Plan content, trade outcomes, user profiles, and activity feeds live off-chain in a Cloudflare Workers API backed by D1 and R2. The Solana program handles trustless vault locking and SOL custody, storing only a content hash on-chain for integrity verification.

## Docs

| Document | Purpose |
|----------|---------|
| [CONTEXT.md](./CONTEXT.md) | Domain glossary, architecture, data flow |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How to deploy the program, API, and frontend |
| [API.md](./API.md) | Workers API endpoint reference |
| [PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md) | Full project specification |

## Features

- Create vaults identified by trading plan titles
- Deposit SOL into vaults as commitment
- Submit detailed trading plans with markdown analysis, images, and tags
- Track trade outcomes (P&L, notes, screenshots)
- Activity feed across all your vaults
- Close unused vaults and reclaim rent

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Rust, Anchor 0.31.1 |
| Blockchain | Solana (Devnet) |
| Off-chain API | Cloudflare Workers + D1 + R2 |
| Auth | Sign-In With Solana (SIWS) |
| Frontend | Next.js 15.5 (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui |
| State | Jotai + TanStack React Query |
| Testing | Vitest |

## Architecture

```
User Wallet ──sign tx──▶ Solana Program (on-chain)
    │                        └── Vault (owner, status, SOL)
    │                        └── Plan (content_hash, content_uri)
    │
    ▼
Cloudflare Workers API ──▶ D1 (plans, outcomes, activity, users)
    └── R2 (images)
```

| PDA | Seeds |
|-----|-------|
| Vault | `["vault", sha256(plan_title), owner_pubkey]` |
| Plan | `["plan", vault_pda_pubkey]` |

| Instruction | Description |
|-------------|-------------|
| `initialize_vault` | Create a new vault and associated plan account |
| `deposit` | Transfer SOL from owner to vault PDA |
| `submit_plan` | Store content hash + URI on-chain, unlock vault |
| `withdraw` | Withdraw funds from an unlocked vault |
| `close_vault` | Close vault and plan accounts, reclaim rent |

## Getting Started

### Prerequisites

- Solana CLI 4.0+
- Anchor 0.31+
- Node.js 20+
- pnpm 9+
- Cloudflare account (for API)

### Setup

```bash
git clone https://github.com/indralukmana/school-of-solana-s7-program.git
cd school-of-solana-s7-program
pnpm install:all     # installs dependencies for all workspaces
pnpm build:program   # builds the Anchor program, copies IDL to frontend
pnpm test:program    # runs test suite on local validator
```

### Development

```bash
pnpm dev             # starts Next.js dev server on port 3000
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to the API worker URL.

### Production

```bash
pnpm build           # builds both program and frontend
pnpm ci              # full pipeline: install, build, test, lint, format, build
```

## Project Structure

```
├── anchor_project/             # Solana Anchor program + tests
│   ├── programs/plan-vault/    # Program source (Rust)
│   ├── tests/                  # Vitest tests (26 scenarios)
│   └── scripts/                # TypeScript transaction helpers
├── workers/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts            # Router
│   │   ├── auth.ts             # SIWS authentication
│   │   ├── cron-handler.ts     # Cron reconciliation
│   │   ├── schema.sql          # D1 database schema
│   │   └── routes/             # plans, outcomes, users, activity, images
│   └── wrangler.toml           # Worker + D1 + R2 config
├── frontend/                   # Next.js frontend
│   └── src/
│       ├── app/                # Pages and layouts
│       ├── components/         # UI components
│       ├── hooks/              # React Query hooks
│       └── lib/                # API client, Anchor client, IDL
└── package.json                # Root orchestration scripts
```

## License

MIT
