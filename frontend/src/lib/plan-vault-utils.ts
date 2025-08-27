import { PublicKey } from '@solana/web3.js'
import { PLAN_VAULT_PROGRAM_ID } from './plan-vault-program'

export async function getVaultPda(owner: PublicKey, title: string): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('vault'),
      Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(title))),
      owner.toBuffer(),
    ],
    PLAN_VAULT_PROGRAM_ID,
  )
  return pda
}

export async function getPlanPda(vault: PublicKey): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress([Buffer.from('plan'), vault.toBuffer()], PLAN_VAULT_PROGRAM_ID)
  return pda
}
