// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import PlanVaultIDL from './anchor-dist/idl/plan_vault.json'
import type { PlanVault } from './anchor-dist/types/plan_vault'

// Re-export the generated IDL and type
export { PlanVault, PlanVaultIDL }

// The programId is imported from the program IDL.
export const PLAN_VAULT_PROGRAM_ID = new PublicKey(PlanVaultIDL.address)

// This is a helper function to get the PlanVault Anchor program.
export function getPlanVaultProgram(provider: AnchorProvider, address?: PublicKey): Program<PlanVault> {
  return new Program(
    {
      ...PlanVaultIDL,
      address: address ? address.toBase58() : PlanVaultIDL.address,
    } as PlanVault,
    provider,
  )
}

// This is a helper function to get the program ID for the PlanVault program depending on the cluster.
export function getPlanVaultProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return PLAN_VAULT_PROGRAM_ID
  }
}
