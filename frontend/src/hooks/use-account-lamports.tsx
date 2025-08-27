import { useEffect, useMemo } from 'react'
import { Connection, PublicKey, Commitment } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export type AccountLamportsInfo = {
  lamports: number
  rentExemptMin: number
  excessLamports: number
  dataLen: number
  exists: boolean
}

export const fetchAccountLamportsInfo = async (
  connection: Connection,
  pubkey: PublicKey,
  commitment: Commitment = 'confirmed',
): Promise<AccountLamportsInfo> => {
  const info = await connection.getAccountInfo(pubkey, commitment)
  if (!info) {
    return {
      lamports: 0,
      rentExemptMin: 0,
      excessLamports: 0,
      dataLen: 0,
      exists: false,
    }
  }
  const rent = await connection.getMinimumBalanceForRentExemption(info.data.length)
  const excess = Math.max(info.lamports - rent, 0)
  return {
    lamports: info.lamports,
    rentExemptMin: rent,
    excessLamports: excess,
    dataLen: info.data.length,
    exists: true,
  }
}

type UseAccountLamportsOptions = {
  refetchIntervalMs?: number // optional polling
  enabled?: boolean
  commitment?: Commitment
}

export const useAccountLamportsQuery = (
  connection: Connection | null,
  pubkey: PublicKey | null,
  opts?: UseAccountLamportsOptions,
) => {
  const queryClient = useQueryClient()

  const pubkeyBase58 = pubkey?.toBase58() ?? null
  const rpcEndpoint = connection?.rpcEndpoint ?? null

  const key = useMemo(() => ['solana', 'accountLamports', rpcEndpoint, pubkeyBase58], [rpcEndpoint, pubkeyBase58])
  const commitment = opts?.commitment ?? 'confirmed'

  const query = useQuery<AccountLamportsInfo>({
    queryKey: key,
    queryFn: async () => {
      if (!connection || !pubkey) {
        return {
          lamports: 0,
          rentExemptMin: 0,
          excessLamports: 0,
          dataLen: 0,
          exists: false,
        }
      }
      return fetchAccountLamportsInfo(connection, pubkey, commitment)
    },
    enabled: !!connection && !!pubkey && (opts?.enabled ?? true),
    // Reasonable caching; tune as needed
    staleTime: 5_000,
    gcTime: 60_000,
    refetchInterval: opts?.refetchIntervalMs ?? false,
  })

  // Live updates via onAccountChange -> invalidate query
  useEffect(() => {
    if (!connection || !pubkey) return
    let subId: number | null = null

    ;(async () => {
      try {
        subId = connection.onAccountChange(
          pubkey,
          () => {
            // Invalidate to refetch fresh rent/lamports
            queryClient.invalidateQueries({ queryKey: key }).catch(() => {})
          },
          commitment,
        )
      } catch {}
    })()

    return () => {
      if (subId !== null) {
        connection.removeAccountChangeListener(subId).catch(() => {})
      }
    }
  }, [connection, pubkey, commitment, queryClient, key])

  return query
}
