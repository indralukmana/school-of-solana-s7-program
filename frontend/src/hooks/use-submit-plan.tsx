import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { createPlan, confirmPlan, postEvent, type PlanContent } from '@/lib/api-client'

export function useSubmitPlan(vaultAddress: PublicKey, planAddress: PublicKey | null) {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['submit-plan', { publicKey, vaultAddress }],
    mutationFn: async (planContent: PlanContent) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!planAddress) throw new Error('Plan address not available')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://plan-vault-api.workers.dev'
      const fullContent = { ...planContent, contentUri: `${apiUrl}/api/plans/placeholder` }

      // 1. Submit content to API
      const { id, contentHash } = await createPlan(fullContent)
      const contentUri = `${apiUrl}/api/plans/${id}`

      // 2. Submit on-chain with content hash
      const signature = await program.methods
        .submitPlan({
          contentHash: Array.from(Buffer.from(contentHash, 'hex')),
          contentUri,
        })
        .accountsPartial({ vaultAccount: vaultAddress, owner: publicKey, plan: planAddress })
        .rpc()

      // 3. Confirm with API
      await confirmPlan(id, signature)

      // 4. Post event for activity feed (non-blocking)
      postEvent({
        eventType: 'plan_submitted',
        actorId: publicKey.toBase58(),
        vaultAddress: vaultAddress.toBase58(),
        planId: id,
        signature,
        metadata: JSON.stringify({ title: planContent.title }),
      }).catch(() => {})

      return { signature, contentHash }
    },
    onSuccess: ({ signature }) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['get-vault'] })
      queryClient.invalidateQueries({ queryKey: ['get-plan'] })
      queryClient.invalidateQueries({ queryKey: ['api-plans'] })
      queryClient.invalidateQueries({ queryKey: ['api-activity'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
