import { useQuery } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { PublicKey } from '@solana/web3.js'

export function useGetPlan(planAddress: PublicKey | null) {
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)

  return useQuery({
    queryKey: ['get-plan', { planAddress }],
    queryFn: async () => {
      if (!planAddress) return null
      try {
        return await program.account.plan.fetch(planAddress)
      } catch {
        return null // Plan account might not exist yet or could have been closed.
      }
    },
    enabled: !!planAddress, // Only run the query if planAddress is not null
  })
}
