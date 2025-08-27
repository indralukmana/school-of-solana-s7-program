'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useSubmitPlan } from '@/hooks/use-submit-plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlanFormProps {
  vaultAddress: PublicKey
  planPda: PublicKey | null
}

export function PlanForm({ vaultAddress, planPda }: PlanFormProps) {
  const [planDetails, setPlanDetails] = useState({
    tradingPlatform: '',
    riskLevel: '',
    ticker: '',
    investmentAmount: 0,
    stopLoss: 0,
    takeProfit: 0,
  })
  const submitPlan = useSubmitPlan(vaultAddress, planPda)

  const handlePlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setPlanDetails((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }))
  }

  if (!planPda) return null

  return (
    <div className="space-y-4">
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
  )
}
