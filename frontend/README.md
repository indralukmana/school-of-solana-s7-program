# Plan Vault - Frontend

This directory contains the frontend for the Plan Vault dApp, built with Next.js, TypeScript, and Tailwind CSS. It provides a user-friendly interface for interacting with the [Plan Vault Solana program](../anchor_project/README.md).

**Deployed URL:** <https://plan-vault-ackee-program-task.vercel.app>

## Features

- **Wallet Integration**: Connects to Solana wallets using the Wallet Adapter.
- **Create Vaults**: Users can create a new vault for a specific trading plan.
- **Manage Vaults**: View a list of all created vaults, their status, and balance.
- **Deposit & Withdraw**: Easily deposit SOL into a vault and withdraw it after a plan is submitted.
- **Submit Plans**: A dedicated form to submit a detailed trading plan, which unlocks the vault.
- **Close Vaults**: Users can close a vault to reclaim the rent-exempt SOL.

## How to Use the dApp

1. **Connect Wallet**: Use the "Select Wallet" button to connect your Solana wallet.
2. **Create a Vault**: On the homepage, provide a title for your trading plan to create a new vault.
3. **View Vaults**: Navigate to the "My Vaults" page to see all your vaults.
4. **Deposit Funds**: Select a vault and use the deposit form to add SOL.
5. **Submit Plan**: Once a vault is funded, submit your detailed trading plan to unlock it.
6. **Withdraw Funds**: After the plan is submitted, you can withdraw the SOL from your vault.

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework for production.
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at scale.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
- [Shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) - Libraries for integrating Solana wallets.
- [@coral-xyz/anchor](https://www.anchor-lang.com/) - Solana Sealevel Framework.

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [pnpm](https://pnpm.io/installation)

## Setup

Install the dependencies using pnpm:

```bash
pnpm install
```

## Available Scripts

### `pnpm dev`

Runs the app in development mode with hot-reloading. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `pnpm build`

Builds the application for production usage.

### `pnpm start`

Starts a Next.js production server.

### `pnpm lint`

Runs ESLint to find and fix problems in the code.

### `pnpm format`

Formats the code using Prettier.
