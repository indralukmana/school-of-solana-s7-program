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
  const [amount, setAmount] = useState('')
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
    setAmount(maxSol.toString())
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Allow only numbers and a single dot
    value = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

    // Remove leading zeros for integers, but allow "0."
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '')
    }

    // Prepend '0' if starts with '.'
    if (value.startsWith('.')) {
      value = '0' + value
    }

    // Limit to 9 decimal places
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 9) {
      value = `${parts[0]}.${parts[1].substring(0, 9)}`
    }

    setAmount(value)
  }

  const depositAmount = parseFloat(amount) || 0

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Deposit SOL</h3>
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Amount in SOL"
            value={amount}
            onChange={handleAmountChange}
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
