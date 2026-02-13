'use client'

import { useParams, useRouter } from 'next/navigation'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect, useMemo } from 'react'
import { useGetVault } from '@/hooks/use-get-vault'
import { useGetPlan } from '@/hooks/use-get-plan'
import { useCloseVault } from '@/hooks/use-close-vault'
import { useAccountLamportsQuery } from '@/hooks/use-account-lamports'
import { getPlanPda } from '@/lib/plan-vault-utils'
import { DepositForm } from './deposit-form'
import { PlanForm } from './plan-form'
import { PlanConfirmation } from './plan-confirmation'
import { VaultProgress } from './vault-progress'

function contentHashIsEmpty(plan: { contentHash: number[] } | null | undefined): boolean {
  if (!plan) return true
  return plan.contentHash.every((b: number) => b === 0)
}

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
        <AppHero title="Vault" subtitle="A promise backed by SOL." />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (getVault.isError || !getVault.data) {
    return (
      <div>
        <AppHero title="Vault" subtitle="A promise backed by SOL." />
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
  const planSubmitted = getPlan.data && !contentHashIsEmpty(getPlan.data)
  const planLoaded = getPlan.data !== undefined

  let currentStep = 1
  if (vaultBalance > 0) currentStep = 2
  if (planSubmitted) currentStep = 3
  if (planSubmitted && vaultBalance > 0) currentStep = 4

  return (
    <div>
        <AppHero title={vault.planTitle} subtitle="" />
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
            {!planSubmitted && vaultBalance === 0 && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Deposit SOL</CardTitle>
                </CardHeader>
                <CardContent>
                  <DepositForm vaultAddress={vaultAddress} />
                </CardContent>
              </Card>
            )}

            {!planSubmitted && planLoaded && vaultBalance > 0 && (
              <Card className="bg-white/[0.04] border-white/[0.08]">
                <CardHeader>
                  <CardTitle>Submit Trading Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlanForm vaultAddress={vaultAddress} planPda={planPda} vaultTitle={vault.planTitle} />
                </CardContent>
              </Card>
            )}

            {planSubmitted && planPda && (
              <PlanConfirmation
                planHash={contentHashToHex(getPlan.data!.contentHash as number[])}
                vaultAddress={vaultAddress}
                planPda={planPda}
              />
            )}

            {!planSubmitted && planLoaded && (
              <>
                <Separator />

                <Card className="bg-white/[0.04] border-red-500/10">
                  <CardHeader>
                    <CardTitle className="text-red-400">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Closing will return all rent-exempt SOL to your wallet. This action is irreversible.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" disabled={closeVault.isPending}>
                          {closeVault.isPending ? 'Closing...' : 'Close Vault'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Close Vault</DialogTitle>
                          <DialogDescription>
                            This will permanently close the vault and return all remaining SOL to your wallet.
                            This action is irreversible.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogTrigger>
                          <Button variant="destructive" onClick={() => closeVault.mutate()} disabled={closeVault.isPending}>
                            {closeVault.isPending ? 'Closing...' : 'Close Vault'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function contentHashToHex(hash: number[]): string {
  return hash.map((b) => b.toString(16).padStart(2, '0')).join('')
}
