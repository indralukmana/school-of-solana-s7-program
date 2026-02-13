import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'
import { postEvent } from '@/lib/api-client'

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

      const sig = await program.methods
        .deposit(new BN(amount * LAMPORTS_PER_SOL))
        .accountsPartial({ vaultAccount: vaultAddress, owner: publicKey })
        .rpc()
      return { signature: sig, amount }
    },
    onSuccess: ({ signature, amount }) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['get-vault', { vaultAddress }] })
      queryClient.invalidateQueries({ queryKey: ['api-activity'] })
      postEvent({
        eventType: 'deposit_made',
        actorId: publicKey!.toBase58(),
        vaultAddress: vaultAddress.toBase58(),
        signature,
        metadata: JSON.stringify({ amount }),
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
