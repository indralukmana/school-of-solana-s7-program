'use client'

import Link from 'next/link'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IdlAccounts } from '@coral-xyz/anchor'
import type { PlanVault } from '@/lib/plan-vault-program'

type VaultAccount = IdlAccounts<PlanVault>['vaultAccount']

interface VaultCardProps {
  publicKey: PublicKey
  account: VaultAccount
  excessLamports: number
}

export function VaultCard({ publicKey, account, excessLamports }: VaultCardProps) {
  const status = Object.keys(account.status)[0]
  const isLocked = status === 'locked'
  const balance = (excessLamports / LAMPORTS_PER_SOL).toFixed(4)

  return (
    <Link href={`/vaults/${publicKey.toBase58()}`}>
      <Card className="h-full bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{account.planTitle}</span>
            <Badge variant={isLocked ? 'destructive' : 'default'}>{status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className="text-lg font-semibold">{balance} SOL</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vault Address</p>
              <p className="text-sm truncate text-muted-foreground font-mono">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
