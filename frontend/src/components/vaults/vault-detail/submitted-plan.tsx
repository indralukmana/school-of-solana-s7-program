'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Plan } from '@/lib/plan-vault-program'
import { useApiPlan } from '@/hooks/use-api-plans'

function contentHashToHex(hash: number[]): string {
  return hash.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function SubmittedPlan({ plan }: { plan: Plan | null | undefined }) {
  const contentHash = plan ? contentHashToHex(plan.contentHash as number[]) : ''
  const isDefaultHash = contentHash === '00'.repeat(32)
  const { data: richPlan, isLoading } = useApiPlan(isDefaultHash || !plan ? null : contentHash)

  if (!plan) return null

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const stopLossPct = richPlan?.stopLossBps ? (richPlan.stopLossBps ?? 0) / 100 : 0
  const takeProfitPct = richPlan?.takeProfitBps ? (richPlan.takeProfitBps ?? 0) / 100 : 0
  const maxPct = Math.max(stopLossPct, takeProfitPct, 1)
  const tags: string[] =
    richPlan?.tags ? (typeof richPlan.tags === 'string' ? JSON.parse(richPlan.tags) : richPlan.tags) : []
  const imageUrls: string[] =
    richPlan?.imageUrls
      ? typeof richPlan.imageUrls === 'string'
        ? JSON.parse(richPlan.imageUrls)
        : richPlan.imageUrls
      : []

  return (
    <div className="space-y-6">
      {richPlan?.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Analysis</p>
          <div className="text-sm whitespace-pre-wrap bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
            {richPlan.description}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {richPlan?.tradingPlatform && (
          <Badge variant="secondary" className="text-sm">
            {richPlan.tradingPlatform}
          </Badge>
        )}
        {richPlan?.riskLevel && (
          <Badge variant="secondary" className="text-sm">
            {richPlan.riskLevel}
          </Badge>
        )}
        {richPlan?.ticker && (
          <Badge variant="secondary" className="text-sm">
            {richPlan.ticker}
          </Badge>
        )}
        {tags.map((t: string) => (
          <Badge key={t} variant="outline" className="text-xs">
            {t}
          </Badge>
        ))}
      </div>

      {richPlan?.investmentLamports && richPlan.investmentLamports > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">Investment Amount</p>
          <p className="text-xl font-bold">{richPlan.investmentLamports / LAMPORTS_PER_SOL} SOL</p>
        </div>
      )}

      {(stopLossPct > 0 || takeProfitPct > 0) && (
        <div className="space-y-4">
          {stopLossPct > 0 && (
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
          )}
          {takeProfitPct > 0 && (
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
          )}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {imageUrls.map((url: string) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt="Plan chart"
              className="rounded-lg max-h-48 border border-white/[0.06]"
            />
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground font-mono mt-1 break-all">Content hash: {contentHash}</p>
      </div>
    </div>
  )
}
