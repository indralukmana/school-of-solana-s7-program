import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { getVaultPda, getPlanPda } from '@/lib/plan-vault-utils'
import { toast } from 'sonner'

export function useInitializeVault() {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['initialize-vault', { publicKey }],
    mutationFn: async (planTitle: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const vaultPda = await getVaultPda(publicKey, planTitle)
      const planPda = await getPlanPda(vaultPda)
      return program.methods
        .initializeVault(planTitle)
        .accountsPartial({
          vaultAccount: vaultPda,
          owner: publicKey,
          plan: planPda,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return queryClient.invalidateQueries({ queryKey: ['get-vaults'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
