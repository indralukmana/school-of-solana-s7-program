'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiAnalytics } from '@/hooks/use-api-analytics'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

interface Props {
  owner: string
}

export function PerformanceCards({ owner }: Props) {
  const { data, isLoading } = useApiAnalytics(owner)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white/[0.04] border-white/[0.08]">
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data || data.totalOutcomes === 0) return null

  const pnlSol = data.totalPnlLamports / LAMPORTS_PER_SOL
  const pnlColor = pnlSol >= 0 ? 'text-emerald-400' : 'text-red-400'
  const pfLabel =
    data.profitFactor === null
      ? '∞'
      : (data.profitFactor ?? 0) >= 2
        ? 'Excellent'
        : (data.profitFactor ?? 0) >= 1.5
          ? 'Good'
          : 'Poor'

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Performance</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardContent className="pt-6">
            <p className={`text-2xl font-bold ${pnlColor}`}>
              {pnlSol >= 0 ? '+' : ''}
              {pnlSol.toFixed(2)} SOL
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total P&amp;L</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-purple-400">
              {data.profitFactor === null ? '∞' : (data.profitFactor ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Profit Factor · {pfLabel}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-blue-400">{data.totalOutcomes}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed Trades</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
