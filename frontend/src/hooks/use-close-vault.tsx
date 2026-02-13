import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { postEvent } from '@/lib/api-client'

export function useCloseVault(vaultAddress: PublicKey, planAddress: PublicKey | null) {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationKey: ['close-vault', { publicKey, vaultAddress }],
    mutationFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!planAddress) throw new Error('Plan address not available')

      return program.methods
        .closeVault()
        .accountsPartial({ vaultAccount: vaultAddress, owner: publicKey, plan: planAddress })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['get-vaults'] })
      queryClient.invalidateQueries({ queryKey: ['api-activity'] })
      router.push('/vaults')
      postEvent({
        eventType: 'vault_closed',
        actorId: publicKey!.toBase58(),
        vaultAddress: vaultAddress.toBase58(),
        signature,
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
