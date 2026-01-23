import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = 'HoVCutYBhZU7aectEWT6eCXk4M2ttskGF5Y8XSshPw8e'
const RPC_URL = 'https://api.devnet.solana.com'

export async function handleCron(env: { DB: D1Database; CORS_ORIGIN: string }): Promise<void> {
  const conn = new Connection(RPC_URL)

  const sigs = await conn.getSignaturesForAddress(new PublicKey(PROGRAM_ID), { limit: 20 }, 'confirmed')

  for (const sigInfo of sigs) {
    if (sigInfo.err) continue

    const existing = await env.DB.prepare(
      'SELECT id FROM activity_events WHERE signature = ?',
    )
      .bind(sigInfo.signature)
      .first()
    if (existing) continue

    const tx = await conn.getTransaction(sigInfo.signature, {
      maxSupportedTransactionVersion: 0,
    })
    if (!tx || !tx.meta?.logMessages) continue

    const logs = tx.meta.logMessages
    const eventType = detectEventType(logs)

    if (eventType) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO activity_events (id, event_type, actor_id, vault_address, signature, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          crypto.randomUUID(),
          eventType,
          tx.transaction.message.staticAccountKeys[0].toBase58(),
          extractVaultAddress(logs),
          sigInfo.signature,
          new Date(sigInfo.blockTime! * 1000).toISOString(),
        )
        .run()
    }
  }
}

function detectEventType(logs: string[]): string | null {
  const logStr = logs.join(' ')
  if (logStr.includes('Instruction: InitializeVault')) return 'vault_created'
  if (logStr.includes('Instruction: Deposit')) return 'deposit_made'
  if (logStr.includes('Instruction: SubmitPlan')) return 'plan_submitted'
  if (logStr.includes('Instruction: Withdraw')) return 'withdraw_completed'
  if (logStr.includes('Instruction: CloseVault')) return 'vault_closed'
  return null
}

function extractVaultAddress(logs: string[]): string {
  for (const log of logs) {
    if (log.startsWith('Program log: Vault: ')) {
      return log.slice('Program log: Vault: '.length)
    }
  }
  return ''
}
