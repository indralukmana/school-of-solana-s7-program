'use client'

import { PublicKey } from '@solana/web3.js'
import { useWithdraw } from '@/hooks/use-withdraw'
import { Button } from '@/components/ui/button'

export function WithdrawButton({ vaultAddress }: { vaultAddress: PublicKey }) {
  const withdraw = useWithdraw(vaultAddress)

  return (
    <div>
      <h3 className="text-xl font-bold">Withdraw Funds</h3>
      <Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
        {withdraw.isPending ? 'Withdrawing...' : 'Withdraw'}
      </Button>
    </div>
  )
}
