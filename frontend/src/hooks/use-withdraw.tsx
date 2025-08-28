import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'

export function useWithdraw(vaultAddress: PublicKey) {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['withdraw', { publicKey, vaultAddress }],
    mutationFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')

      return program.methods.withdraw().accountsPartial({ vaultAccount: vaultAddress, owner: publicKey }).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return queryClient.invalidateQueries({ queryKey: ['get-vault', { vaultAddress }] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
