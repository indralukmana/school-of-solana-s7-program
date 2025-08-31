import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'

interface SubmitPlanArgs {
  tradingPlatform: string
  riskLevel: string
  ticker: string
  investmentAmount: number
  stopLossBps: number
  takeProfitBps: number
}

export function useSubmitPlan(vaultAddress: PublicKey, planAddress: PublicKey | null) {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['submit-plan', { publicKey, vaultAddress }],
    mutationFn: async (plan: SubmitPlanArgs) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!planAddress) throw new Error('Plan address not available')

      const planArgs = {
        tradingPlatform: plan.tradingPlatform,
        riskLevel: plan.riskLevel,
        ticker: plan.ticker,
        investmentAmount: new BN(plan.investmentAmount * LAMPORTS_PER_SOL),
        stopLossBps: new BN(plan.stopLossBps),
        takeProfitBps: new BN(plan.takeProfitBps),
      }

      return program.methods
        .submitPlan(planArgs)
        .accountsPartial({ vaultAccount: vaultAddress, owner: publicKey, plan: planAddress })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['get-vault', { vaultAddress }] })
      queryClient.invalidateQueries({ queryKey: ['get-plan', { planAddress }] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
