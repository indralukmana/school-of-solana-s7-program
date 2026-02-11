'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useSiwsAuth } from '@/hooks/use-siws-auth'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/solana/solana-provider'
import { Loader2, RefreshCw } from 'lucide-react'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet()
  const { isAuthenticated, isSigningIn, authError, signIn } = useSiwsAuth()

  if (isAuthenticated) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Plan Vault
        </h1>
        <p className="text-muted-foreground max-w-md">
          {!connected
            ? 'Connect your wallet to get started.'
            : 'Sign in with your wallet to access Plan Vault.'}
        </p>
      </div>

      {!connected ? (
        <WalletButton />
      ) : (
        <div className="flex flex-col items-center gap-3">
          {isSigningIn ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            <Button onClick={signIn} size="lg" className="px-8">
              Sign In
            </Button>
          )}
          {authError && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-400">{authError}</span>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2" onClick={signIn}>
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
