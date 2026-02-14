'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useApiActivity, type ActivityEvent } from '@/hooks/use-api-activity'

const EVENT_LABELS: Record<string, string> = {
  vault_created: 'Created',
  deposit_made: 'Deposited',
  plan_submitted: 'Submitted Plan',
  withdraw_completed: 'Withdrew',
  vault_closed: 'Closed',
  outcome_added: 'Added Outcome',
}

const EVENT_COLORS: Record<string, string> = {
  vault_created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  deposit_made: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  plan_submitted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  withdraw_completed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vault_closed: 'bg-red-500/10 text-red-400 border-red-500/20',
  outcome_added: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const metadata = event.metadata ? JSON.parse(event.metadata) : {}
  return (
    <>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs ${EVENT_COLORS[event.eventType] ?? ''}`}>
            {EVENT_LABELS[event.eventType] ?? event.eventType}
          </Badge>
          <div>
            <p className="text-sm font-medium">{metadata.title ?? event.eventType}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {event.actorId.slice(0, 4)}...{event.actorId.slice(-4)}
              {event.vaultAddress &&
                ` · Vault: ${event.vaultAddress.slice(0, 4)}...${event.vaultAddress.slice(-4)}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            {new Date(event.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {event.signature && (
            <p className="text-xs text-muted-foreground font-mono">
              TX: {event.signature.slice(0, 4)}...{event.signature.slice(-4)}
            </p>
          )}
        </div>
      </div>
      <Separator />
    </>
  )
}

export function ActivityFeed() {
  const { publicKey } = useWallet()
  const { data: allEvents, isLoading, isError, error } = useApiActivity(
    publicKey ? { actor: publicKey.toBase58() } : undefined,
  )
  const events = allEvents ?? []

  if (!publicKey) {
    return (
      <div>
        <AppHero title="Journal" subtitle="Every vault event, from creation to close." />
        <div className="text-center py-12 text-muted-foreground">
          Please connect your wallet to view activity.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <AppHero title="Journal" subtitle="Every vault event, from creation to close." />
        <div className="max-w-2xl mx-auto px-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const filteredEvents = (type: string): ActivityEvent[] =>
    type === 'all' ? events : events.filter((e) => e.eventType === type)

  const tabTypes = [
    'all',
    'vault_created',
    'deposit_made',
    'plan_submitted',
    'withdraw_completed',
    'vault_closed',
  ]

  if (isError) {
    return (
      <div>
        <AppHero title="Journal" subtitle="Every vault event, from creation to close." />
        <div className="max-w-2xl mx-auto px-4 text-center py-12">
          <p className="text-red-400">Failed to load activity.</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Journal" subtitle="Every vault event, from creation to close." />
      <div className="max-w-2xl mx-auto px-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vault_created">Created</TabsTrigger>
            <TabsTrigger value="deposit_made">Deposits</TabsTrigger>
            <TabsTrigger value="plan_submitted">Plans</TabsTrigger>
            <TabsTrigger value="withdraw_completed">Withdrawals</TabsTrigger>
            <TabsTrigger value="vault_closed">Closed</TabsTrigger>
          </TabsList>
          {tabTypes.map((type) => (
            <TabsContent key={type} value={type}>
              <div className="space-y-0">
                {filteredEvents(type).length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No events yet.</p>
                ) : (
                  filteredEvents(type).map((event) => <ActivityRow key={event.id} event={event} />)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
