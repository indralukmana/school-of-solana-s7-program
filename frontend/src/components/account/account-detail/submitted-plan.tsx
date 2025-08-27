'use client'

import { Plan } from '@/lib/plan-vault-program'

export function SubmittedPlan({ plan }: { plan: Plan }) {
  return (
    <div>
      <h3 className="text-xl font-bold">Submitted Plan Details</h3>
      <p>Trading Platform: {plan.tradingPlatform}</p>
      <p>Risk Level: {plan.riskLevel}</p>
      <p>Ticker: {plan.ticker}</p>
      <p>Investment Amount: {plan.investmentAmount.toString()} lamports</p>
      <p>Stop Loss: {plan.stopLoss}</p>
      <p>Take Profit: {plan.takeProfit}</p>
    </div>
  )
}
