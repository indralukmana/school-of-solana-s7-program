'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import type { AnalyticsResponse } from '@/lib/api-client'

interface Props {
  data: AnalyticsResponse
}

export function AnalyticsSummary({ data }: Props) {
  const pnlSol = data.totalPnlLamports / LAMPORTS_PER_SOL
  const pnlColor = pnlSol >= 0 ? 'text-emerald-400' : 'text-red-400'
  const winRatePercent = Math.round(data.winRate * 100)

  const stats = [
    {
      label: 'Total P&L',
      value: `${pnlSol >= 0 ? '+' : ''}${pnlSol.toFixed(2)} SOL`,
      color: pnlColor,
    },
    {
      label: 'Profit Factor',
      value: data.profitFactor === null ? '\u221e' : (data.profitFactor ?? 0).toFixed(2),
      color: 'text-purple-400',
    },
    {
      label: 'Win Rate',
      value: `${winRatePercent}%`,
      color: 'text-blue-400',
    },
    {
      label: 'Executed',
      value: data.totalOutcomes.toString(),
      color: 'text-emerald-400',
    },
    {
      label: 'Cancelled',
      value: data.cancelledCount.toString(),
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-white/[0.04] border-white/[0.08]">
          <CardContent className="pt-6 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
