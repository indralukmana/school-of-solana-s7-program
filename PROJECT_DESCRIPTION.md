# Project Description

**Deployed Frontend URL:** <https://plan-vault-ackee-program-task.vercel.app>

**Solana Program ID:** HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e
[Solana Explorer](https://explorer.solana.com/address/HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e?cluster=devnet)

## Project Overview

### Description

This project is a decentralized trading diary with a commitment vault. Users can
create a vault for a specific trading plan, deposit SOL as a commitment, and
then, after submitting a detailed trading plan, withdraw the funds to execute
the trade. The vault remains locked until the plan is submitted, enforcing a
disciplined approach to trading.

### Key Features

- **Create Vault**: Initialize a new vault for a trading plan.
- **Deposit SOL**: Add funds to the vault.
- **Submit Trading Plan**: Submit a detailed trading plan, which unlocks the
  vault.
- **Withdraw SOL**: Withdraw funds from the unlocked vault to execute the trade.

### How to Use the dApp

1. **Connect Wallet**
2. **Create a Vault:** Provide a title for your trading plan to create a new
   vault.
3. **Deposit Funds:** Deposit SOL into the vault.
4. **Submit Plan:** Submit your detailed trading plan. This will unlock your
   vault.
5. **Withdraw Funds:** Withdraw the SOL from your vault to your wallet.

## Program Architecture

Plan Vault uses a **hybrid web2/web3 architecture**. The on-chain Solana program handles
trustless vault locking/unlocking and SOL custody. Rich plan content, trade outcomes,
user profiles, and activity feeds live in a Cloudflare Workers API backed by D1 (SQLite) and R2 (object storage).

| Layer | Technology | Stores |
|-------|-----------|--------|
| On-chain | Solana Anchor Program | Vault (owner, status, SOL), Plan (content_hash, content_uri) |
| Off-chain | Cloudflare Workers + D1 + R2 | Rich plan content, outcomes, user profiles, activity, images |

### PDA Usage

**PDAs Used:**

- **Vault PDA**: Derived from the seeds
  `["vault", sha256(plan_title), user_wallet_pubkey]`. This ensures that each
  user has a unique vault for each trading plan title.
- **Plan PDA**: Derived from the seeds `["plan", vault_pda_pubkey]`. This links
  a specific plan to a vault. Stores only a `content_hash` (SHA-256 of off-chain plan JSON) and `content_uri` (API lookup URL).

### Program Instructions

**Instructions Implemented:**

- `initialize_vault`: Creates a new vault account and an associated empty plan
  account for a user, identified by a plan title.
- `deposit`: Allows the user to deposit SOL into their vault.
- `submit_plan`: Stores the content hash + URI on-chain and unlocks the vault for withdrawal.
- `withdraw`: Allows the user to withdraw the unlocked funds from the vault.
- `close_vault`: Closes the vault and its associated plan account, returning any
  rent-exempt lamports to the owner.

### Account Structure

```rust
#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub status: VaultStatus,
    pub token_vault: Pubkey,
    pub plan_title_hash: [u8; 32],
    pub plan_title: String,
}

#[account]
pub struct Plan {
    pub vault_account: Pubkey,
    pub content_hash: [u8; 32],  // SHA-256 of off-chain plan JSON
    pub content_uri: String,     // API lookup URL for the full plan
}
```

### API & Database

A Cloudflare Workers API serves plan content, trade outcomes, activity feeds, and user profiles.
See [API.md](./API.md) for endpoint reference, [DEPLOYMENT.md](./DEPLOYMENT.md) for setup,
and [CONTEXT.md](./CONTEXT.md) for the full domain glossary and data flow.

## Testing

### Test Coverage

The tests cover all the instructions and their various scenarios.

**Happy Path Tests:**

- **Initialize Vault**
  - Successfully creates both a new vault account and an associated empty plan
    account. Sets the correct owner, `plan_title`, `plan_title_hash`, and an
    initial `Locked` status on the vault.
  - Successfully initializes with titles of various valid lengths (from 3 to 200
    characters).
- **Deposit**
  - A user can successfully deposit SOL, and the vault's lamport balance
    increases by the deposited amount.
- **Submit Plan**
  - A user can submit a valid plan to a vault with a positive SOL balance (above
    rent).
  - Successfully stores the plan's data in the existing `plan` account.
  - The vault's status correctly changes from `Locked` to `Unlocked`.
- **Withdraw**
  - The owner can successfully withdraw the available SOL from an unlocked
    vault.
  - The vault's balance is reduced to the rent-exempt minimum, and the owner's
    wallet balance increases by the withdrawn amount.
- **Close Vault**
  - The owner can successfully close the vault and plan account (both before and
    after submitting plan details).

**Unhappy Path Tests:**

- **Initialize**
  - Fails to initialize a vault with an empty, too short (<3 chars), or too long
    (>200 chars) title.
  - Fails when trying to initialize a vault that already exists for the same
    user and title.
- **Deposit**
  - Fails on a zero-amount deposit.
  - Fails if the depositor has insufficient funds.
  - Fails if a non-owner tries to deposit into the vault.
- **Submit Plan**
  - Fails if the vault has insufficient funds (i.e., only rent-exempt balance).
  - Fails if a non-owner tries to submit a plan.
  - Fails if the `trading_platform`, `risk_level`, or `ticker` in the arguments
    exceed their maximum allowed length.
- **Withdraw**
  - Fails if the vault is still in a `Locked` state (plan not submitted).
  - Fails if a non-owner tries to withdraw funds.
- **Close Vault**
  - Fails if a non-owner tries to close the vault.
  - Fails if the provided plan account does not belong to the vault account.

### Running Tests

```bash
pnpm test:program
```

### Design Notes

This project uses native SOL for the vault. A potential future enhancement would
be to support SPL tokens, such as stablecoins, for the trading funds. The
current implementation uses the plan title to derive the vault PDA, which means
a user can have multiple vaults for different trading ideas.
