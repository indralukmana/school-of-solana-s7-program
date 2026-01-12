# Plan Vault - Anchor Program

This directory contains the Solana program for the Plan Vault dApp, built with
Anchor.

## Overview

The Plan Vault program is a decentralized trading diary with a commitment vault.
It allows users to create a vault for a specific trading plan, deposit SOL as a
commitment, and then, after submitting a detailed trading plan, withdraw the
funds to execute the trade. The vault remains locked until the plan is
submitted, enforcing a disciplined approach to trading.

This program is part of a larger full-stack dApp. For more information about the
entire project, see the main [Project Description](../PROJECT_DESCRIPTION.md).

## Features

The program exposes the following instructions:

- **`initialize_vault`**: Creates a new vault and an associated plan account for
  a user.
- **`deposit`**: Allows the user to deposit SOL into their vault.
- **`submit_plan`**: Submits the details of the trading plan and unlocks the
  vault for withdrawal.
- **`withdraw`**: Allows the user to withdraw the unlocked funds from the vault.
- **`close_vault`**: Closes the vault and its associated plan account, returning
  any rent-exempt lamports to the owner.

## Program Architecture

The program is built around two main accounts: `VaultAccount` and `Plan`.

### Accounts

- **`VaultAccount`**: This account stores information about the vault, including
  the owner, the plan title, and the vault's status (`Locked` or `Unlocked`).
- **`Plan`**: This account holds the details of the trading plan, such as the
  trading platform, ticker, risk level, and investment amount. It is linked to a
  specific `VaultAccount`.

### PDA (Program Derived Address) Structure

The program uses PDAs to create unique accounts for each vault and plan.

- **Vault PDA**: Derived from the seeds
  `["vault", sha256(plan_title), user_wallet_pubkey]`. This ensures that each
  user has a unique vault for each trading plan title.
- **Plan PDA**: Derived from the seeds `["plan", vault_pda_pubkey]`. This links
  a specific plan to a vault.

## Prerequisites

Before getting started, make sure you have the following installed:

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools) 4.0.3+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.32.1
- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/installation)

## Setup

Install the Node.js dependencies:

```bash
pnpm install
```

## Building the Program

### For local testing

```bash
anchor build        # builds program + generates IDL + TypeScript types
pnpm build          # same as above, also copies IDL/types to frontend
```

### For deployment (Devnet / Mainnet)

Devnet has activated [SIMD-0500](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0500-disable-deployment-of-sbpf-v0-v1-v2.md),
which rejects programs compiled with SBPFv0/v1/v2. You **must** build with
`--arch v3` (SBPFv3) for deployment:

```bash
cargo build-sbf --arch v3 --manifest-path programs/plan-vault/Cargo.toml
solana program deploy --url devnet target/deploy/plan_vault.so --program-id target/deploy/plan_vault-keypair.json --skip-feature-verify
```

> `--skip-feature-verify` is needed because the local Solana CLI may not yet
> recognize SBPFv3 as enabled — the cluster validates it correctly.

> **Note:** `anchor build` does not currently support `--arch v3`. Use
> `cargo build-sbf` for deployment builds. For local testing, `anchor build`
> (with default SBPFv0) works fine — the local test validator is unaffected.

### Platform-tools v1.54

If you encounter `sbpfv3-solana-solana` target not found, download and install
platform-tools v1.54:

```bash
curl -sSfL -o /tmp/platform-tools-v1.54.tar.bz2 \
  "https://github.com/anza-xyz/platform-tools/releases/download/v1.54/platform-tools-linux-x86_64.tar.bz2"
mkdir -p ~/.cache/solana/v1.54/platform-tools
tar jxf /tmp/platform-tools-v1.54.tar.bz2 -C ~/.cache/solana/v1.54/platform-tools/
```

Then rebuild with `--tools-version v1.54`:

```bash
cargo build-sbf --arch v3 --tools-version v1.54 --manifest-path programs/plan-vault/Cargo.toml
```

## Testing

The program comes with a comprehensive test suite that covers all instructions,
including happy paths and error conditions.

To run the tests, use the following command:

```bash
pnpm test
```

This will execute the test suite defined in the `tests/` directory using Vitest.

### Test notes

- Tests use `@coral-xyz/anchor@^0.32.1`. In this version, `SendTransactionError`
  surfaces only `"Simulation failed."` in `.message`. The helper
  `txSendAndConfirm` in `tests/test-helpers.ts` catches these errors and
  re-throws with the Anchor error code parsed from transaction logs, so that
  `.toThrow()` assertions can match against `ConstraintHasOne` etc.
