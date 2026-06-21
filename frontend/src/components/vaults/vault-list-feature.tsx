'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AppHero } from '@/components/app-hero'
import { useGetVaults } from '@/hooks/use-get-vaults'
import { useApiPlans } from '@/hooks/use-api-plans'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { VaultCard } from './vault-card'
import { Search } from 'lucide-react'

function VaultCardSkeleton() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

export default function VaultListFeature() {
  const { publicKey } = useWallet()
  const getVaults = useGetVaults()
  const apiPlans = useApiPlans(
    publicKey ? { owner: publicKey.toBase58() } : undefined,
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const cancelledVaults = useMemo(() => {
    if (!apiPlans.data) return new Set<string>()
    return new Set(
      apiPlans.data.filter((p) => p.cancelled).map((p) => p.vaultAddress),
    )
  }, [apiPlans.data])

  if (!publicKey) {
    return (
      <div>
        <AppHero title="Your Vaults" subtitle="Each vault is a promise backed by SOL." />
        <div className="text-center py-8 text-muted-foreground">Please connect your wallet to view your vaults.</div>
      </div>
    )
  }

  if (getVaults.isLoading) {
    return (
      <div>
        <AppHero title="Your Vaults" subtitle="Each vault is a promise backed by SOL." />
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <VaultCardSkeleton />
            <VaultCardSkeleton />
            <VaultCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const vaults = getVaults.data ?? []
  const activeVaults = vaults.filter((v) => !cancelledVaults.has(v.publicKey.toBase58()))
  const cancelledList = vaults.filter((v) => cancelledVaults.has(v.publicKey.toBase58()))

  const filteredVaults = (statusFilter === 'cancelled' ? cancelledList : activeVaults).filter((vault) => {
    const status = Object.keys(vault.account.status)[0]
    const matchesSearch = search === '' || vault.account.planTitle.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || statusFilter === 'cancelled' || status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (vaults.length === 0) {
    return (
      <div>
        <AppHero title="Your Vaults" subtitle="Each vault is a promise backed by SOL." />
        <div className="text-center py-12 max-w-md mx-auto px-4">
          <h3 className="text-2xl font-semibold">No Vaults Found</h3>
          <p className="text-muted-foreground mt-2">
            You have not created any vaults yet.{' '}
            <Link href="/" className="underline font-bold text-accent">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Your Vaults" subtitle="Each vault is a promise backed by SOL." />
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search vaults..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            {cancelledList.length > 0 && (
              <TabsTrigger value="cancelled">Cancelled ({cancelledList.length})</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value={statusFilter}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaults.map((vault) => (
                <VaultCard
                  key={vault.publicKey.toBase58()}
                  publicKey={vault.publicKey}
                  account={vault.account}
                  excessLamports={vault.excessLamports}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
