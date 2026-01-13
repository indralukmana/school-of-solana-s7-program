'use client'

import { PublicKey } from '@solana/web3.js'
import { useWithdraw } from '@/hooks/use-withdraw'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function WithdrawButton({ vaultAddress }: { vaultAddress: PublicKey }) {
  const withdraw = useWithdraw(vaultAddress)
  const isLoading = withdraw.isPending

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Withdraw all available SOL from this vault to your wallet.</p>
      <Button
        onClick={() => withdraw.mutate()}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Withdrawing...
          </span>
        ) : (
          'Withdraw'
        )}
      </Button>
    </div>
  )
}
