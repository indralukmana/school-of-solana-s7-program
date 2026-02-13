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
  const [error, setError] = useState('')
  const deposit = useDeposit(vaultAddress)
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const walletLamports = useAccountLamportsQuery(connection, publicKey)

  const feeBuffer = 0.01 * LAMPORTS_PER_SOL
  const maxLamports = walletLamports.data ? walletLamports.data.lamports - feeBuffer : 0
  const maxSol = Math.max(0, maxLamports / LAMPORTS_PER_SOL)
  const walletSol = (walletLamports.data?.lamports ?? 0) / LAMPORTS_PER_SOL

  const handleMaxClick = () => {
    setAmount(maxSol.toString())
    setError('')
  }

  const depositAmount = parseFloat(amount) || 0
  const isLoading = deposit.isPending

  const handleDeposit = () => {
    setError('')
    if (depositAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    if (depositAmount > maxSol) {
      setError(`Insufficient balance. You have ${walletSol.toFixed(4)} SOL available.`)
      return
    }
    deposit.mutate(depositAmount)
  }

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
              onChange={(e) => { setAmount(e.target.value); setError('') }}
              className={`pr-12 ${error ? 'border-red-500' : ''}`}
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
            onClick={handleDeposit}
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
        <p className="text-xs text-muted-foreground mt-1">
          Wallet balance: {walletSol.toFixed(4)} SOL &middot; Max deposit: {maxSol.toFixed(4)} SOL
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </Field>
    </div>
  )
}
