'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getAuthNonce, verifyAuth, clearToken } from '@/lib/api-client'
import bs58 from 'bs58'

interface SiwsAuthState {
  isAuthenticated: boolean
  isSigningIn: boolean
  authError: string | null
  pubkey: string | null
  signIn: () => Promise<void>
  signOut: () => void
}

const SiwsAuthContext = createContext<SiwsAuthState>({
  isAuthenticated: false,
  isSigningIn: false,
  authError: null,
  pubkey: null,
  signIn: async () => {},
  signOut: () => {},
})

export function useSiwsAuth() {
  return useContext(SiwsAuthContext)
}

export function SiwsAuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected, wallet } = useWallet()
  const [token, setTokenState] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const ignoreRef = useRef(false)

  const reset = useCallback(() => {
    setTokenState(null)
    clearToken()
    setIsSigningIn(false)
    setAuthError(null)
  }, [])

  const doSignIn = useCallback(async () => {
    if (!publicKey) return
    if (!signMessage) {
      setAuthError('Wallet does not support message signing')
      return
    }
    if (ignoreRef.current) return
    setIsSigningIn(true)
    setAuthError(null)
    try {
      const address = publicKey.toBase58()
      const { message } = await getAuthNonce(address)
      if (ignoreRef.current) return
      const encoded = new TextEncoder().encode(message)
      const sigBytes = await signMessage(encoded)
      if (ignoreRef.current) return
      const sigB58 = bs58.encode(sigBytes)
      const { token: newToken } = await verifyAuth(address, message, sigB58)
      if (ignoreRef.current) return
      setTokenState(newToken)
    } catch (e) {
      if (ignoreRef.current) return
      const msg = e instanceof Error ? e.message : 'Authentication failed'
      setAuthError(msg)
    } finally {
      if (!ignoreRef.current) setIsSigningIn(false)
    }
  }, [publicKey, signMessage])

  useEffect(() => {
    ignoreRef.current = false

    if (!connected || !publicKey) {
      reset()
      return
    }

    if (!token) {
      doSignIn()
    }

    return () => {
      ignoreRef.current = true
    }
  }, [connected, publicKey, token, doSignIn, reset])

  useEffect(() => {
    const adapter = wallet?.adapter
    if (!adapter) return
    const onDisconnect = () => {
      ignoreRef.current = true
      reset()
    }
    adapter.on('disconnect', onDisconnect)
    return () => {
      adapter.off('disconnect', onDisconnect)
    }
  }, [wallet, reset])

  const signOut = useCallback(() => {
    ignoreRef.current = true
    reset()
  }, [reset])

  return (
    <SiwsAuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isSigningIn,
        authError,
        pubkey: publicKey?.toBase58() ?? null,
        signIn: doSignIn,
        signOut,
      }}
    >
      {children}
    </SiwsAuthContext.Provider>
  )
}
