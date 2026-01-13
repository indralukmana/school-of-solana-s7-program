'use client'

import { Badge } from '@/components/ui/badge'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Plan } from '@/lib/plan-vault-program'

export function SubmittedPlan({ plan }: { plan: Plan | null | undefined }) {
  if (!plan) return null

  const stopLossPct = plan.stopLossBps ? Number(plan.stopLossBps) / 100 : 0
  const takeProfitPct = plan.takeProfitBps ? Number(plan.takeProfitBps) / 100 : 0
  const maxPct = Math.max(stopLossPct, takeProfitPct, 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-sm">
          {plan.tradingPlatform}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          {plan.riskLevel}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          {plan.ticker}
        </Badge>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Investment Amount</p>
        <p className="text-xl font-bold">{Number(plan.investmentAmount) / LAMPORTS_PER_SOL} SOL</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Stop Loss</span>
            <span className="text-red-400 font-medium">{stopLossPct.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2.5">
            <div
              className="bg-red-500/60 h-2.5 rounded-full transition-all"
              style={{ width: `${(stopLossPct / maxPct) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Take Profit</span>
            <span className="text-emerald-400 font-medium">{takeProfitPct.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2.5">
            <div
              className="bg-emerald-500/60 h-2.5 rounded-full transition-all"
              style={{ width: `${(takeProfitPct / maxPct) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
