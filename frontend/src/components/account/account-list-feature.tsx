'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { AppHero } from '../app-hero'
import { useGetVaults } from '@/hooks/use-get-vaults'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function VaultCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountListFeature() {
  const { publicKey } = useWallet()
  const getVaults = useGetVaults()

  const renderContent = () => {
    if (!publicKey) {
      return <div className="text-center py-8">Please connect your wallet to view your vaults.</div>
    }
    if (getVaults.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VaultCardSkeleton />
          <VaultCardSkeleton />
          <VaultCardSkeleton />
        </div>
      )
    }
    if (!getVaults.data?.length) {
      return (
        <div className="text-center py-12">
          <h3 className="text-2xl font-semibold">No Vaults Found</h3>
          <p className="text-muted-foreground mt-2">
            You have not created any vaults yet. Use the form{' '}
            <Link href="/" className="underline font-bold">
              here
            </Link>{' '}
            to create one.
          </p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getVaults.data.map((vault) => (
          <Link key={vault.publicKey.toBase58()} href={`/account/${vault.publicKey.toBase58()}`}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{vault.account.planTitle}</span>
                  <Badge variant={Object.keys(vault.account.status)[0] === 'Locked' ? 'destructive' : 'default'}>
                    {Object.keys(vault.account.status)[0]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold">{(vault.excessLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vault Address</p>
                    <p className="text-sm truncate">{vault.publicKey.toBase58()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <AppHero title="My Vaults" subtitle="Here are all the vaults you have created." />
      {renderContent()}
    </div>
  )
}
