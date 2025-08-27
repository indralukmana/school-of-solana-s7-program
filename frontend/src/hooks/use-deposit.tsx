import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export function useDeposit(vaultAddress: PublicKey) {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['deposit', { publicKey, vaultAddress }],
    mutationFn: async (amount: number) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (amount <= 0) throw new Error('Invalid amount')

      return program.methods
        .deposit(new BN(amount * LAMPORTS_PER_SOL)) // Convert SOL to lamports
        .accountsPartial({ vaultAccount: vaultAddress, owner: publicKey })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return queryClient.invalidateQueries({ queryKey: ['get-vault', { vaultAddress }] })
    },
    onError: (error: Error) => {
      console.error(error)
      alert(`Error: ${error.message}`)
    },
  })
}
