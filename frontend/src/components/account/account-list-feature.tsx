'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { AppHero } from '../app-hero'
import { useGetVaults } from '@/hooks/use-get-vaults';

export default function AccountListFeature() {
  const { publicKey } = useWallet()
  const getVaults = useGetVaults();

  return (
    <div>
      <AppHero title="My Vaults" subtitle="Here are all the vaults you have created." />
      {getVaults.isLoading && <div className="text-center">Loading...</div>}
      {!publicKey && <div className="text-center">Please connect your wallet.</div>}
      {publicKey && !getVaults.isLoading && !getVaults.data?.length && (
        <div className="text-center">No vaults found.</div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getVaults.data?.map((vault) => (
          <Link key={vault.publicKey.toBase58()} className="card" href={`/account/${vault.publicKey.toBase58()}`}>
            <div className="card-body">
              <h2 className="card-title">{vault.account.planTitle}</h2>
              <p>Status: {Object.keys(vault.account.status)[0]}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
