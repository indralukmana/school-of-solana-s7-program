'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiAnalytics } from '@/hooks/use-api-analytics'
import { useApiOutcomesByOwner } from '@/hooks/use-api-outcomes'
import { AnalyticsSummary } from '@/components/analytics/analytics-summary'
import { PnlOverTimeChart } from '@/components/analytics/pnl-over-time-chart'
import { TickerPerformanceChart } from '@/components/analytics/ticker-performance-chart'
import { OutcomesTable } from '@/components/analytics/outcomes-table'

export default function AnalyticsPage() {
  const { publicKey } = useWallet()

  if (!publicKey) {
    return (
      <div>
        <AppHero title="Analytics" subtitle="Track your trading performance across all vaults." />
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Connect your wallet to see your analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Analytics" subtitle="Your trading performance at a glance." />

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <AnalyticsSection owner={publicKey.toBase58()} />
      </div>
    </div>
  )
}

function AnalyticsSection({ owner }: { owner: string }) {
  const { data, isLoading } = useApiAnalytics(owner)
  const { data: outcomes, isLoading: outcomesLoading } = useApiOutcomesByOwner(owner, 50)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/[0.04] border-white/[0.08]">
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data || data.totalOutcomes === 0) {
    return (
      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-lg font-semibold mb-1">No trading data yet</p>
          <p className="text-sm text-muted-foreground">
            Complete a trade by submitting outcomes to see your analytics here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <AnalyticsSummary data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-sm">P&amp;L Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlOverTimeChart months={data.outcomeMonths} />
          </CardContent>
        </Card>

        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-sm">P&amp;L by Ticker</CardTitle>
          </CardHeader>
          <CardContent>
            <TickerPerformanceChart tickers={data.tickerStats} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-sm">Recent Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          {outcomesLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <OutcomesTable outcomes={outcomes} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
