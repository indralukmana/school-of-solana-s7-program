import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { getVaultPda, getPlanPda } from '@/lib/plan-vault-utils'
import { toast } from 'sonner'
import { postEvent } from '@/lib/api-client'

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
      const sig = await program.methods
        .initializeVault(planTitle)
        .accountsPartial({ vaultAccount: vaultPda, owner: publicKey, plan: planPda })
        .rpc()
      return { signature: sig, vaultPda }
    },
    onSuccess: ({ signature, vaultPda }) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['get-vaults'] })
      queryClient.invalidateQueries({ queryKey: ['api-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['api-activity'] })
      postEvent({
        eventType: 'vault_created',
        actorId: publicKey!.toBase58(),
        vaultAddress: vaultPda.toBase58(),
        signature,
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
