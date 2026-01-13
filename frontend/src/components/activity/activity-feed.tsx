'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '@/components/app-hero'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetVaults } from '@/hooks/use-get-vaults'

export function ActivityFeed() {
  const { publicKey } = useWallet()
  const getVaults = useGetVaults()

  if (!publicKey) {
    return (
      <div>
        <AppHero title="Activity" subtitle="View all your vault transactions" />
        <div className="text-center py-12 text-muted-foreground">Please connect your wallet to view activity.</div>
      </div>
    )
  }

  if (getVaults.isLoading) {
    return (
      <div>
        <AppHero title="Activity" subtitle="View all your vault transactions" />
        <div className="max-w-2xl mx-auto px-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const vaults = getVaults.data ?? []

  return (
    <div>
      <AppHero title="Activity" subtitle="View all your vault transactions" />
      <div className="max-w-2xl mx-auto px-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="submit">Submit Plan</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="close">Close</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-1">
              {vaults.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No vaults yet. Create one to see activity here.
                </p>
              ) : (
                vaults.map((vault) => (
                  <div key={vault.publicKey.toBase58()}>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{vault.account.planTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Vault: {vault.publicKey.toBase58().slice(0, 4)}...{vault.publicKey.toBase58().slice(-4)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Object.keys(vault.account.status)[0] === 'locked' ? 'Locked' : 'Unlocked'}
                      </span>
                    </div>
                    <Separator />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="create">
            <p className="text-center py-8 text-muted-foreground">
              Transaction history coming soon. Each vault creation, deposit, plan submission, and withdrawal will appear
              here.
            </p>
          </TabsContent>
          <TabsContent value="deposit">
            <p className="text-center py-8 text-muted-foreground">Deposit history — coming soon.</p>
          </TabsContent>
          <TabsContent value="submit">
            <p className="text-center py-8 text-muted-foreground">Plan submission history — coming soon.</p>
          </TabsContent>
          <TabsContent value="withdraw">
            <p className="text-center py-8 text-muted-foreground">Withdrawal history — coming soon.</p>
          </TabsContent>
          <TabsContent value="close">
            <p className="text-center py-8 text-muted-foreground">Closure history — coming soon.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
