'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { OutcomePanel } from './outcome-panel'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useCloseVault } from '@/hooks/use-close-vault'
import { useApiPlan } from '@/hooks/use-api-plans'
import { useApiOutcomes } from '@/hooks/use-api-outcomes'
import { cancelPlan, postEvent } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { useTransactionToast } from '@/components/use-transaction-toast'
import type { PlanRecord } from '@/lib/api-client'

function PlanDetails({ plan }: { plan: PlanRecord }) {
  const tags: string[] = plan.tags ? (typeof plan.tags === 'string' ? JSON.parse(plan.tags) : plan.tags) : []

  return (
    <div className="space-y-4">
      {plan.description && plan.description.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Analysis</p>
          <div className="text-sm whitespace-pre-wrap bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
            {plan.description}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {plan.tradingPlatform && <Badge variant="secondary" className="text-sm">{plan.tradingPlatform}</Badge>}
        {plan.riskLevel && <Badge variant="secondary" className="text-sm">{plan.riskLevel}</Badge>}
        {plan.ticker && <Badge variant="secondary" className="text-sm">{plan.ticker}</Badge>}
        {tags.map((t: string) => (
          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
        ))}
      </div>

      {(plan.investmentLamports ?? 0) > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">Investment Amount</p>
          <p className="text-lg font-bold">{(plan.investmentLamports ?? 0) / LAMPORTS_PER_SOL} SOL</p>
        </div>
      )}
    </div>
  )
}

export function PlanConfirmation({
  planHash,
  vaultAddress,
  planPda,
  onDone,
}: {
  planHash: string
  vaultAddress: PublicKey
  planPda: PublicKey
  onDone?: () => void
}) {
  const [started, setStarted] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const closeVault = useCloseVault(vaultAddress, planPda)
  const { data: richPlan, isLoading: planLoading } = useApiPlan(planHash)
  const { data: outcomes } = useApiOutcomes(planHash)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { publicKey } = useWallet()
  const transactionToast = useTransactionToast()
  const hasOutcome = (outcomes?.length ?? 0) > 0

  const handleClose = (signature: string) => {
    transactionToast(signature)
    queryClient.invalidateQueries({ queryKey: ['get-vaults'] })
    queryClient.invalidateQueries({ queryKey: ['get-vault'] })
    queryClient.invalidateQueries({ queryKey: ['api-analytics'] })
    queryClient.invalidateQueries({ queryKey: ['api-plans'] })
    queryClient.invalidateQueries({ queryKey: ['api-activity'] })
    postEvent({
      eventType: 'vault_closed',
      actorId: publicKey!.toBase58(),
      vaultAddress: vaultAddress.toBase58(),
      signature,
    }).catch(() => {})
    router.push('/vaults')
    onDone?.()
  }

  const handleCancelPlan = async () => {
    setCancelling(true)
    try {
      await cancelPlan(planHash)
      setConfirmOpen(false)
      closeVault.mutate(undefined, {
        onSuccess: (sig) => handleClose(sig),
        onError: () => toast.error('Failed to close vault'),
      })
    } catch {
      toast.error('Failed to cancel plan')
      setCancelling(false)
    }
  }

  if (!started) {
    return (
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader>
          <CardTitle>Plan Submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : richPlan ? (
            <PlanDetails plan={richPlan} />
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
            <Button onClick={() => setStarted(true)}>Execute</Button>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancel Plan and Close Vault</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Cancel Plan
                  </DialogTitle>
                  <DialogDescription>
                    This will mark the plan as cancelled and close the vault, returning all SOL to your wallet.
                    No outcome will be recorded. This action is irreversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep Plan</Button>
                  <Button variant="destructive" onClick={handleCancelPlan} disabled={cancelling}>
                    {cancelling ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Closing...
                      </span>
                    ) : 'Cancel Plan and Close'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/[0.04] border-white/[0.08]">
      <CardHeader>
        <CardTitle>Record Trade Outcome</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {richPlan && <PlanDetails plan={richPlan} />}

        <OutcomePanel planHash={planHash} />

        <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">Cancel Plan and Close Vault</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Cancel Plan
                </DialogTitle>
                <DialogDescription>
                  This will mark the plan as cancelled and close the vault, returning all SOL to your wallet.
                  No outcome will be recorded. This action is irreversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep Plan</Button>
                <Button variant="destructive" onClick={handleCancelPlan} disabled={cancelling}>
                  {cancelling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Closing...
                    </span>
                  ) : 'Cancel Plan and Close'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {hasOutcome && (
            <Button
              onClick={() => closeVault.mutate(undefined, { onSuccess: (sig) => handleClose(sig) })}
              disabled={closeVault.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            >
              {closeVault.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Closing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Close Vault
                </span>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
