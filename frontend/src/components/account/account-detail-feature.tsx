'use client'

import { useParams, useRouter } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { AppHero } from '@/components/app-hero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useGetVault } from '@/hooks/use-get-vault'
import { useGetPlan } from '@/hooks/use-get-plan'
import { useDeposit } from '@/hooks/use-deposit'
import { useSubmitPlan } from '@/hooks/use-submit-plan'
import { useWithdraw } from '@/hooks/use-withdraw'
import { useCloseVault } from '@/hooks/use-close-vault'
import { getPlanPda } from '@/lib/plan-vault-utils'

export default function AccountDetailFeature() {
  const { address } = useParams()
  const router = useRouter()
  const vaultAddress = new PublicKey(address as string)

  const [planPda, setPlanPda] = useState<PublicKey | null>(null)

  useEffect(() => {
    getPlanPda(vaultAddress).then(setPlanPda)
  }, [vaultAddress])

  const getVault = useGetVault(vaultAddress)
  const getPlan = useGetPlan(planPda)
  const deposit = useDeposit(vaultAddress)
  const submitPlan = useSubmitPlan(vaultAddress, planPda)
  const withdraw = useWithdraw(vaultAddress)
  const closeVault = useCloseVault(vaultAddress, planPda)

  const [depositAmount, setDepositAmount] = useState(0)
  const [planDetails, setPlanDetails] = useState({
    tradingPlatform: '',
    riskLevel: '',
    ticker: '',
    investmentAmount: 0,
    stopLoss: 0,
    takeProfit: 0,
  })

  const handlePlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setPlanDetails((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }))
  }

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

  return (
    <div>
      <AppHero title="Vault Details" subtitle={`Details for vault ${address}`} />
      <div className="space-y-6 max-w-xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>
          <h3 className="text-xl font-bold">Vault Info</h3>
          <p>Title: {vault.planTitle}</p>
          <p>Owner: {vault.owner.toBase58()}</p>
          <p>Status: {isUnlocked ? 'Unlocked' : 'Locked'}</p>
        </div>

        {!isUnlocked && (
          <div className="space-y-4">
            <div>
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

            <div>
              <h3 className="text-xl font-bold">Submit Trading Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input name="tradingPlatform" placeholder="Trading Platform" onChange={handlePlanChange} />
                <Input name="riskLevel" placeholder="Risk Level" onChange={handlePlanChange} />
                <Input name="ticker" placeholder="Ticker" onChange={handlePlanChange} />
                <Input
                  name="investmentAmount"
                  type="number"
                  placeholder="Investment Amount (SOL)"
                  onChange={handlePlanChange}
                />
                <Input name="stopLoss" type="number" placeholder="Stop Loss" onChange={handlePlanChange} />
                <Input name="takeProfit" type="number" placeholder="Take Profit" onChange={handlePlanChange} />
              </div>
              <Button onClick={() => submitPlan.mutate(planDetails)} disabled={submitPlan.isPending} className="mt-4">
                {submitPlan.isPending ? 'Submitting...' : 'Submit Plan'}
              </Button>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div>
            <h3 className="text-xl font-bold">Withdraw Funds</h3>
            <Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
              {withdraw.isPending ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </div>
        )}

        {getPlan.data && isUnlocked && (
          <div>
            <h3 className="text-xl font-bold">Submitted Plan Details</h3>
            <p>Trading Platform: {getPlan.data.tradingPlatform}</p>
            <p>Risk Level: {getPlan.data.riskLevel}</p>
            <p>Ticker: {getPlan.data.ticker}</p>
            <p>Investment Amount: {getPlan.data.investmentAmount.toString()} lamports</p>
            <p>Stop Loss: {getPlan.data.stopLoss}</p>
            <p>Take Profit: {getPlan.data.takeProfit}</p>
          </div>
        )}

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-xl font-bold">Close Vault</h3>
          <p className="text-sm text-muted-foreground">
            This will close both the vault and the plan account, and return all rent-exempt SOL to your wallet. This
            action is irreversible.
          </p>
          <Button variant="destructive" onClick={() => closeVault.mutate()} disabled={closeVault.isPending} className="mt-2">
            {closeVault.isPending ? 'Closing...' : 'Close Vault'}
          </Button>
        </div>
      </div>
    </div>
  )
}
