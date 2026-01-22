'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAuthNonce, verifyAuth, setToken, getToken } from '@/lib/api-client'
import { PublicKey } from '@solana/web3.js'

interface SiwsAuthState {
  isAuthenticated: boolean
  pubkey: string | null
  token: string | null
  signIn: () => Promise<void>
  signOut: () => void
}

const SiwsAuthContext = createContext<SiwsAuthState>({
  isAuthenticated: false,
  pubkey: null,
  token: null,
  signIn: async () => {},
  signOut: () => {},
})

export function useSiwsAuth() {
  return useContext(SiwsAuthContext)
}

export function SiwsAuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet()
  const [token, setTokenState] = useState<string | null>(null)

  useEffect(() => {
    if (!connected || !publicKey) {
      setTokenState(null)
      setToken(null)
    }
  }, [connected, publicKey])

  const signIn = async () => {
    if (!publicKey || !signMessage) throw new Error('Wallet not ready')

    const address = publicKey.toBase58()
    const { nonce, message } = await getAuthNonce(address)
    const encoded = new TextEncoder().encode(message)
    const signatureBytes = await signMessage(encoded)
    const sigBase58 = Buffer.from(signatureBytes).toString('base64')

    const { token: newToken } = await verifyAuth(address, message, sigBase58)
    setTokenState(newToken)
  }

  const signOut = () => {
    setTokenState(null)
    setToken(null)
  }

  return (
    <SiwsAuthContext.Provider
      value={{
        isAuthenticated: !!token,
        pubkey: publicKey?.toBase58() ?? null,
        token,
        signIn,
        signOut,
      }}
    >
      {children}
    </SiwsAuthContext.Provider>
  )
}
