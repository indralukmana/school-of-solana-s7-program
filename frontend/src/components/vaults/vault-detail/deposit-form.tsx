'use client'

import { useState } from 'react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useDeposit } from '@/hooks/use-deposit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useAccountLamportsQuery } from '@/hooks/use-account-lamports'
import { Loader2 } from 'lucide-react'

export function DepositForm({ vaultAddress }: { vaultAddress: PublicKey }) {
  const [amount, setAmount] = useState('')
  const deposit = useDeposit(vaultAddress)
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const walletLamports = useAccountLamportsQuery(connection, publicKey)

  const handleMaxClick = () => {
    if (!walletLamports.data) return
    const feeBuffer = 0.01 * LAMPORTS_PER_SOL
    const maxLamports = walletLamports.data.lamports - feeBuffer
    const maxSol = Math.max(0, maxLamports / LAMPORTS_PER_SOL)
    setAmount(maxSol.toString())
  }

  const depositAmount = parseFloat(amount) || 0
  const isLoading = deposit.isPending

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="deposit-amount">Amount (SOL)</FieldLabel>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="deposit-amount"
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-12"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground text-sm">SOL</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleMaxClick} disabled={!walletLamports.data || isLoading} size="sm">
            Max
          </Button>
          <Button
            onClick={() => deposit.mutate(depositAmount)}
            disabled={isLoading || depositAmount <= 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Depositing...
              </span>
            ) : (
              'Deposit'
            )}
          </Button>
        </div>
      </Field>
    </div>
  )
}
