import { useQuery } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { PublicKey } from '@solana/web3.js'

export function useGetVault(vaultAddress: PublicKey) {
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)

  return useQuery({
    queryKey: ['get-vault', { vaultAddress }],
    queryFn: () => program.account.vaultAccount.fetch(vaultAddress),
  })
}
