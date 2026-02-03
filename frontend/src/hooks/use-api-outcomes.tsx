'use client'

import { useQuery } from '@tanstack/react-query'
import { getOutcomes, getOutcomesByOwner, type Outcome, type UserOutcome } from '@/lib/api-client'

export function useApiOutcomes(planHash: string | null) {
  return useQuery<Outcome[]>({
    queryKey: ['api-outcomes', planHash],
    queryFn: () => (planHash ? getOutcomes(planHash) : []),
    enabled: !!planHash,
    initialData: [],
  })
}

export function useApiOutcomesByOwner(owner: string | null, limit?: number) {
  return useQuery<UserOutcome[]>({
    queryKey: ['api-outcomes', 'owner', owner],
    queryFn: () => getOutcomesByOwner(owner!, limit),
    enabled: !!owner,
    initialData: [],
  })
}
