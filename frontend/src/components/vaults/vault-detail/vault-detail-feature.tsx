'use client'

import { useParams, useRouter } from 'next/navigation'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect, useMemo } from 'react'
import { useGetVault } from '@/hooks/use-get-vault'
import { useGetPlan } from '@/hooks/use-get-plan'
import { useCloseVault } from '@/hooks/use-close-vault'
import { useAccountLamportsQuery } from '@/hooks/use-account-lamports'
import { getPlanPda } from '@/lib/plan-vault-utils'
import { DepositForm } from './deposit-form'
import { PlanForm } from './plan-form'
import { SubmittedPlan } from './submitted-plan'
import { WithdrawButton } from './withdraw-button'
import { VaultProgress } from './vault-progress'

export default function VaultDetailFeature() {
  const { address } = useParams()
  const router = useRouter()
  const vaultAddress = useMemo(() => new PublicKey(address as string), [address])
  const { connection } = useConnection()

  const [planPda, setPlanPda] = useState<PublicKey | null>(null)

  useEffect(() => {
    getPlanPda(vaultAddress).then(setPlanPda)
  }, [vaultAddress])

  const getVault = useGetVault(vaultAddress)
  const getPlan = useGetPlan(planPda)
  const closeVault = useCloseVault(vaultAddress, planPda)
  const lamportsQuery = useAccountLamportsQuery(connection, vaultAddress)

  if (getVault.isLoading) {
    return (
      <div>
        <AppHero title="Vault Details" subtitle="" />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (getVault.isError || !getVault.data) {
    return (
      <div>
        <AppHero title="Vault Details" subtitle="" />
        <div className="text-center py-12 max-w-md mx-auto">
          <p className="text-lg">Vault not found</p>
          <p className="text-sm text-muted-foreground mb-4">This vault may have been closed.</p>
          <Button onClick={() => router.push('/vaults')}>Go back to Vaults</Button>
        </div>
      </div>
    )
  }

  const vault = getVault.data
  const isLocked = Object.keys(vault.status)[0] === 'locked'
  const vaultBalance = (lamportsQuery.data?.excessLamports ?? 0) / LAMPORTS_PER_SOL

  let currentStep = 1
  if (vaultBalance > 0 && isLocked) currentStep = 2
  if (!isLocked && getPlan.data) {
    currentStep = vaultBalance > 0 ? 3 : 4
  }

  return (
    <div>
      <AppHero title="Vault Details" subtitle="" />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/[0.04] border-white/[0.08]">
              <CardHeader>
                <CardTitle>Vault Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{vault.planTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="text-sm font-mono truncate">{vault.owner.toBase58()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={isLocked ? 'destructive' : 'default'} className="mt-1">
                    {isLocked ? 'Locked' : 'Unlocked'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold">{vaultBalance.toFixed(4)} SOL</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.04] border-white/[0.08]">
              <CardContent className="pt-6">
                <VaultProgress currentStep={currentStep} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isLocked && vaultBalance === 0 && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Deposit SOL</CardTitle>
                </CardHeader>
                <CardContent>
                  <DepositForm vaultAddress={vaultAddress} />
                </CardContent>
              </Card>
            )}

            {isLocked && !getPlan.data?.planTitle && vaultBalance > 0 && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Submit Trading Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlanForm vaultAddress={vaultAddress} planPda={planPda} />
                </CardContent>
              </Card>
            )}

            {!isLocked && getPlan.data && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Submitted Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmittedPlan plan={getPlan.data} />
                </CardContent>
              </Card>
            )}

            {!isLocked && getPlan.data && vaultBalance > 0 && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <WithdrawButton vaultAddress={vaultAddress} />
                </CardContent>
              </Card>
            )}

            <Separator />

            <Card className="bg-white/[0.04] border-red-500/10">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Closing will return all rent-exempt SOL to your wallet. This action is irreversible.
                </p>
                <Button variant="destructive" onClick={() => closeVault.mutate()} disabled={closeVault.isPending}>
                  {closeVault.isPending ? 'Closing...' : 'Close Vault'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
