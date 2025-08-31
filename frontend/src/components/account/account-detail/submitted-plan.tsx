'use client'

import { Plan } from '@/lib/plan-vault-program'

export function SubmittedPlan({ plan }: { plan: Plan | null | undefined }) {
  return (
    <div>
      <h3 className="text-xl font-bold">Submitted Plan Details</h3>
      <p>Trading Platform: {plan?.tradingPlatform}</p>
      <p>Risk Level: {plan?.riskLevel}</p>
      <p>Ticker: {plan?.ticker}</p>
      <p>Investment Amount: {plan?.investmentAmount.toString()} lamports</p>
      <p>Stop Loss: {plan?.stopLossBps ? (Number(plan.stopLossBps) / 100).toFixed(2) + '%' : '-'}</p>
      <p>Take Profit: {plan?.takeProfitBps ? (Number(plan.takeProfitBps) / 100).toFixed(2) + '%' : '-'}</p>
    </div>
  )
}
