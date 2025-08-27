'use client'

import { useState } from 'react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useDeposit } from '@/hooks/use-deposit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useAccountLamportsQuery } from '@/hooks/use-account-lamports'

export function DepositForm({ vaultAddress }: { vaultAddress: PublicKey }) {
  const [depositAmount, setDepositAmount] = useState(0)
  const deposit = useDeposit(vaultAddress)
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const walletLamports = useAccountLamportsQuery(connection, publicKey)

  const handleMaxClick = () => {
    if (!walletLamports.data) return
    // Leave a small buffer for transaction fees
    const feeBuffer = 0.01 * LAMPORTS_PER_SOL
    const maxLamports = walletLamports.data.lamports - feeBuffer
    const maxSol = Math.max(0, maxLamports / LAMPORTS_PER_SOL)
    setDepositAmount(maxSol)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Deposit SOL</h3>
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Input
            type="number"
            placeholder="Amount in SOL"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
            className="pr-12" // Add padding for the "SOL" text
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">SOL</span>
          </div>
        </div>
        <Button variant="outline" onClick={handleMaxClick} disabled={!walletLamports.data}>
          Max
        </Button>
        <Button onClick={() => deposit.mutate(depositAmount)} disabled={deposit.isPending || depositAmount <= 0}>
          {deposit.isPending ? 'Depositing...' : 'Deposit'}
        </Button>
      </div>
    </div>
  )
}
