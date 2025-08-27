'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useDeposit } from '@/hooks/use-deposit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DepositForm({ vaultAddress }: { vaultAddress: PublicKey }) {
  const [depositAmount, setDepositAmount] = useState(0)
  const deposit = useDeposit(vaultAddress)

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Deposit SOL</h3>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder="Amount in SOL"
          value={depositAmount}
          onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
        />
        <Button onClick={() => deposit.mutate(depositAmount)} disabled={deposit.isPending}>
          {deposit.isPending ? 'Depositing...' : 'Deposit'}
        </Button>
      </div>
    </div>
  )
}
