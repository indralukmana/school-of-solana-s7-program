'use client'

import { useParams, useRouter } from 'next/navigation'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useGetVault } from '@/hooks/use-get-vault'
import { useGetPlan } from '@/hooks/use-get-plan'
import { useCloseVault } from '@/hooks/use-close-vault'
import { useAccountLamportsQuery } from '@/hooks/use-account-lamports'
import { getPlanPda } from '@/lib/plan-vault-utils'
import { DepositForm } from './account-detail/deposit-form'
import { PlanForm } from './account-detail/plan-form'
import { SubmittedPlan } from './account-detail/submitted-plan'
import { WithdrawButton } from './account-detail/withdraw-button'

export default function AccountDetailFeature() {
  const { address } = useParams()
  const router = useRouter()
  const vaultAddress = new PublicKey(address as string)
  const { connection } = useConnection()

  const [planPda, setPlanPda] = useState<PublicKey | null>(null)

  useEffect(() => {
    getPlanPda(vaultAddress).then(setPlanPda)
  }, [vaultAddress])

  const getVault = useGetVault(vaultAddress)
  const getPlan = useGetPlan(planPda)
  const closeVault = useCloseVault(vaultAddress, planPda)
  const lamportsQuery = useAccountLamportsQuery(connection, vaultAddress)

  if (getVault.isLoading) return <div className="text-center">Loading...</div>
  if (getVault.isError || !getVault.data) {
    return (
      <div className="text-center">
        <p className="text-lg">Vault not found</p>
        <p className="text-sm text-muted-foreground mb-4">This vault may have been closed.</p>
        <Button onClick={() => router.push('/account')}>Go back to Vaults</Button>
      </div>
    )
  }

  const vault = getVault.data
  const isUnlocked = Object.keys(vault.status)[0] === 'Unlocked'
  const vaultBalance = (lamportsQuery.data?.excessLamports ?? 0) / LAMPORTS_PER_SOL

  return (
    <div>
      <AppHero title="Vault Details" subtitle={`Details for vault ${address}`} />
      <div className="space-y-6 max-w-xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>
          <h3 className="text-xl font-bold">Vault Info</h3>
          <p>Title: {vault.planTitle}</p>
          <p>Owner: {vault.owner.toBase58()}</p>
          <p>Status: {isUnlocked ? 'Unlocked' : 'Locked'}</p>
          <p>Balance: {vaultBalance.toFixed(4)} SOL</p>
        </div>

        {!isUnlocked && <DepositForm vaultAddress={vaultAddress} />}

        {!isUnlocked && !getPlan.data && vaultBalance > 0 && <PlanForm vaultAddress={vaultAddress} planPda={planPda} />}

        {getPlan.data && <SubmittedPlan plan={getPlan.data} />}

        {isUnlocked && getPlan.data && vaultBalance > 0 && <WithdrawButton vaultAddress={vaultAddress} />}

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-xl font-bold">Close Vault</h3>
          <p className="text-sm text-muted-foreground">
            This will close both the vault and the plan account, and return all rent-exempt SOL to your wallet. This
            action is irreversible.
          </p>
          <Button
            variant="destructive"
            onClick={() => closeVault.mutate()}
            disabled={closeVault.isPending}
            className="mt-2"
          >
            {closeVault.isPending ? 'Closing...' : 'Close Vault'}
          </Button>
        </div>
      </div>
    </div>
  )
}
