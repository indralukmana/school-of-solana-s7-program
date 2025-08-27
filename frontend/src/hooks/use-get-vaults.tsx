import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from '@/components/solana/solana-provider';
import { getPlanVaultProgram } from '@/lib/plan-vault-program';

export function useGetVaults() {
  const { publicKey } = useWallet();
  const provider = useAnchorProvider();
  const program = getPlanVaultProgram(provider);

  return useQuery({
    queryKey: ['get-vaults', { publicKey }],
    queryFn: async () => {
      if (!publicKey) return [];
      return program.account.vaultAccount.all([{ memcmp: { offset: 8, bytes: publicKey.toBase58() } }]);
    },
  });
}
