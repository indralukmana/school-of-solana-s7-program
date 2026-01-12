# Plan Vault

Decentralized trading diary with a commitment vault on Solana. Create vaults for trading plans, deposit SOL as commitment, and withdraw only after submitting a detailed plan — enforcing a disciplined approach to trading.

**Frontend:** [plan-vault-ackee-program-task.vercel.app](https://plan-vault-ackee-program-task.vercel.app)  
**Program (Devnet):** `HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e` — [Solana Explorer](https://explorer.solana.com/address/HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e?cluster=devnet)

## Features

- Create vaults identified by trading plan titles
- Deposit SOL into vaults as commitment
- Submit detailed trading plans (platform, risk level, ticker, investment amount, stop loss, take profit)
- Withdraw unlocked funds to execute trades
- Close unused vaults and reclaim rent

## Tech Stack

| Layer          | Technology                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| Smart Contract | Rust, [Anchor](https://www.anchor-lang.com/) 0.32.1                              |
| Blockchain     | Solana (Devnet)                                                                  |
| Frontend       | [Next.js](https://nextjs.org/) 15.5 (App Router), React 19                       |
| Styling        | [Tailwind CSS](https://tailwindcss.com/) v4                                      |
| UI Components  | [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)                           |
| Wallet         | [@solana/wallet-adapter](https://github.com/anza-xyz/wallet-adapter)             |
| State          | [Jotai](https://jotai.org/) + [TanStack React Query](https://tanstack.com/query) |
| Testing        | [Vitest](https://vitest.dev/)                                                    |

## Architecture

### Program Derived Addresses

| PDA   | Seeds                                         |
| ----- | --------------------------------------------- |
| Vault | `["vault", sha256(plan_title), owner_pubkey]` |
| Plan  | `["plan", vault_pda_pubkey]`                  |

### Accounts

```
VaultAccount               Plan
├── owner: Pubkey           ├── vault_account: Pubkey
├── status: VaultStatus     ├── plan_title: String
├── token_vault: Pubkey      ├── trading_platform: String
├── plan_title_hash: [u8;32]├── risk_level: String
├── plan_title: String       ├── ticker: String
└── plan: Plan              ├── investment_amount: u64
                             ├── stop_loss: f64
                             └── take_profit: f64
```

### Instructions

| Instruction        | Description                                    |
| ------------------ | ---------------------------------------------- |
| `initialize_vault` | Create a new vault and associated plan account |
| `deposit`          | Transfer SOL from owner to vault PDA           |
| `submit_plan`      | Populate trading plan details, unlock vault    |
| `withdraw`         | Withdraw funds from an unlocked vault          |
| `close_vault`      | Close vault and plan accounts, reclaim rent    |

## Getting Started

### Prerequisites

- Solana CLI 4.0.3+
- Anchor 0.32.1
- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone https://github.com/indralukmana/school-of-solana-s7-program.git
cd school-of-solana-s7-program
pnpm install:all     # installs dependencies for both workspaces
pnpm build:program   # builds the Anchor program, copies IDL to frontend
pnpm test:program    # runs test suite on local validator
```

### Development

```bash
pnpm dev             # starts Next.js dev server on port 3000
```

### Production

```bash
pnpm build           # builds both program and frontend
pnpm ci              # full pipeline: install, build program, test, lint, format check, build frontend
```

## Project Structure

```
├── anchor_project/          # Solana Anchor program + tests
│   ├── programs/plan-vault/  # Program source (Rust)
│   ├── tests/               # Vitest tests (27+ scenarios)
│   └── scripts/             # TypeScript transaction helpers
├── frontend/                # Next.js frontend
│   └── src/
│       ├── app/             # Pages and layouts
│       ├── components/      # UI components
│       ├── hooks/           # React Query hooks
│       └── lib/             # Program client, IDL, utilities
└── package.json             # Root orchestration scripts
```

## Testing

The test suite covers all five program instructions with both happy and unhappy paths:

- **Initialize Vault** — valid/invalid titles, duplicates, boundary lengths
- **Deposit** — successful deposit, zero amount, insufficient funds, non-owner
- **Submit Plan** — valid plan, insufficient vault funds, non-owner, field length limits
- **Withdraw** — successful withdrawal, locked vault, non-owner
- **Close Vault** — close funded/unfunded vaults, non-owner, wrong plan association

```bash
pnpm test:program    # runs tests on local validator

> **Note:** For deployment, the program must be built with `--arch v3` (SBPFv3)
> because devnet has activated [SIMD-0500](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0500-disable-deployment-of-sbpf-v0-v1-v2.md).
> See `anchor_project/README.md` for deployment instructions.
```

## License

MIT
