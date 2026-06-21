'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useMemo } from 'react'
import { PerformanceCards } from './performance-cards'
import Link from 'next/link'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { AppHero } from '../app-hero'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { useInitializeVault } from '@/hooks/use-initialize-vault'
import { useGetVaults } from '@/hooks/use-get-vaults'
import { useApiPlans } from '@/hooks/use-api-plans'

export function DashboardFeature() {
  const { publicKey } = useWallet()
  const [planTitle, setPlanTitle] = useState('')
  const initializeVault = useInitializeVault()
  const getVaults = useGetVaults()
  const apiPlans = useApiPlans(
    publicKey ? { owner: publicKey.toBase58() } : undefined,
  )

  const cancelledVaults = useMemo(() => {
    if (!apiPlans.data) return new Set<string>()
    return new Set(
      apiPlans.data.filter((p) => p.cancelled).map((p) => p.vaultAddress),
    )
  }, [apiPlans.data])

  const handleCreate = () => {
    if (!planTitle) return
    initializeVault.mutate(planTitle, {
      onSuccess: () => setPlanTitle(''),
    })
  }

  if (!publicKey) {
    return (
      <div>
        <AppHero
          title="PlanVault"
          subtitle="Stake SOL on your trading convictions. Create a vault, commit your plan, prove your thesis."
        />
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Connect your wallet to get started</p>
        </div>
      </div>
    )
  }

  const allVaults = getVaults.data ?? []
  const vaults = allVaults.filter((v) => !cancelledVaults.has(v.publicKey.toBase58()))
  const unlocked = vaults.filter((v) => Object.keys(v.account.status)[0] === 'unlocked')
  const totalSol = vaults.reduce((sum, v) => sum + v.excessLamports, 0) / LAMPORTS_PER_SOL

  const stats = [
    { label: 'Active Vaults', value: vaults.length.toString() },
    { label: 'SOL Locked', value: totalSol.toFixed(2) },
    { label: 'Unlocked', value: unlocked.length.toString() },
    { label: 'Completed', value: unlocked.length.toString() },
  ]

  return (
    <div>
      <AppHero
        title="Plan Your Trade"
        subtitle="Stake SOL on your next move. Create a vault, deposit funds, submit your plan, and put your conviction on the line."
      />

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getVaults.isLoading
            ? [1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white/[0.04] border-white/[0.08]">
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                >
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {publicKey && <PerformanceCards owner={publicKey.toBase58()} />}

        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardHeader>
            <CardTitle>Create a New Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex w-full max-w-md items-center gap-2">
              <Input
                type="text"
                placeholder="Enter Plan Title"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                minLength={3}
                maxLength={200}
                className="flex-1"
              />
              <Button
                disabled={!planTitle || initializeVault.isPending}
                onClick={handleCreate}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              >
                {initializeVault.isPending ? 'Creating...' : 'Create Vault'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {vaults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Vaults</h2>
              <Link href="/vaults" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaults.slice(0, 3).map((vault) => (
                <Link key={vault.publicKey.toBase58()} href={`/vaults/${vault.publicKey.toBase58()}`}>
                  <Card className="h-full bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate text-sm">{vault.account.planTitle}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            Object.keys(vault.account.status)[0] === 'locked'
                              ? 'border-red-500/20 text-red-400 bg-red-500/10'
                              : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {Object.keys(vault.account.status)[0]}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-semibold">
                        {(vault.excessLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
