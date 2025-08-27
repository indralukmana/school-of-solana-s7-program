import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getPlanVaultProgram } from '@/lib/plan-vault-program'
import { fetchAccountLamportsInfo } from '@/hooks/use-account-lamports'

export function useGetVaults() {
  const { publicKey } = useWallet()
  const provider = useAnchorProvider()
  const program = getPlanVaultProgram(provider)

  // fetchAccountLamportsInfo(connection, pubkey, commitment)

  return useQuery({
    queryKey: ['get-vaults', { publicKey }],
    queryFn: async () => {
      if (!publicKey) return []
      const vaults = await program.account.vaultAccount.all([{ memcmp: { offset: 8, bytes: publicKey.toBase58() } }])

      const vaultsWithLamports = []
      for (const vault of vaults) {
        const vaultLamports = await fetchAccountLamportsInfo(provider.connection, vault.publicKey)
        const newVaultData = {
          ...vault,
          ...vaultLamports,
        }

        vaultsWithLamports.push(newVaultData)
      }

      return vaultsWithLamports
    },
  })
}
