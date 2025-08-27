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
- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/installation)

## Setup

Install the Node.js dependencies:

```bash
pnpm install
```

## Building the Program

To build the Anchor program, run:

```bash
pnpm build
```

This project also includes a script to copy the generated IDL and types to the
frontend project. This command will execute `anchor build` and then copy the
necessary files.

## Testing

The program comes with a comprehensive test suite that covers all instructions,
including happy paths and error conditions.

To run the tests, use the following command:

```bash
pnpm test
```

This will execute the test suite defined in the `tests/` directory using Vitest.
