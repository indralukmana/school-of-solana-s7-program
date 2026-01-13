'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useSubmitPlan } from '@/hooks/use-submit-plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Loader2 } from 'lucide-react'

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

  const isLoading = submitPlan.isPending

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="tradingPlatform">Trading Platform</FieldLabel>
          <Input
            id="tradingPlatform"
            name="tradingPlatform"
            placeholder="e.g. Binance"
            onChange={handlePlanChange}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="riskLevel">Risk Level</FieldLabel>
          <Input
            id="riskLevel"
            name="riskLevel"
            placeholder="e.g. High"
            onChange={handlePlanChange}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
          <Input
            id="ticker"
            name="ticker"
            placeholder="e.g. SOL"
            onChange={handlePlanChange}
            disabled={isLoading}
            maxLength={10}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="investmentAmount">Investment (SOL)</FieldLabel>
          <Input
            id="investmentAmount"
            name="investmentAmount"
            type="number"
            placeholder="0.0"
            onChange={handlePlanChange}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="stopLossBps">Stop Loss (bps)</FieldLabel>
          <Input
            id="stopLossBps"
            name="stopLossBps"
            type="number"
            placeholder="100"
            onChange={handlePlanChange}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="takeProfitBps">Take Profit (bps)</FieldLabel>
          <Input
            id="takeProfitBps"
            name="takeProfitBps"
            type="number"
            placeholder="200"
            onChange={handlePlanChange}
            disabled={isLoading}
          />
        </Field>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          'Submit Plan'
        )}
      </Button>
    </div>
  )
}
