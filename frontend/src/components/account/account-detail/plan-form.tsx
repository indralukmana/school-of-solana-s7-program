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
    stopLossBps: 0,
    takeProfitBps: 0,
  })
  const [errors, setErrors] = useState<string[]>([])
  const submitPlan = useSubmitPlan(vaultAddress, planPda)

  const handlePlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setPlanDetails((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }))
  }

  const validate = (): string[] => {
    const e: string[] = []
    if (!planDetails.tradingPlatform.trim()) e.push('Trading platform is required')
    if (!planDetails.riskLevel.trim()) e.push('Risk level is required')
    if (!planDetails.ticker.trim()) e.push('Ticker is required')
    if (planDetails.ticker.length > 10) e.push('Ticker must not exceed 10 characters')
    if (planDetails.tradingPlatform.length > 100) e.push('Trading platform must not exceed 100 characters')
    if (planDetails.riskLevel.length > 100) e.push('Risk level must not exceed 100 characters')
    if (planDetails.investmentAmount <= 0) e.push('Investment amount must be greater than 0')
    if (planDetails.stopLossBps <= 0) e.push('Stop loss must be greater than 0 bps')
    if (planDetails.takeProfitBps <= 0) e.push('Take profit must be greater than 0 bps')
    return e
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (validationErrors.length === 0) {
      submitPlan.mutate(planDetails)
    }
  }

  if (!planPda) return null

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Submit Trading Plan</h3>
      {errors.length > 0 && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
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
        <Input name="stopLossBps" type="number" placeholder="Stop Loss (bps)" onChange={handlePlanChange} />
        <Input name="takeProfitBps" type="number" placeholder="Take Profit (bps)" onChange={handlePlanChange} />
      </div>
      <Button onClick={handleSubmit} disabled={submitPlan.isPending} className="mt-4">
        {submitPlan.isPending ? 'Submitting...' : 'Submit Plan'}
      </Button>
    </div>
  )
}
