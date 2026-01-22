'use client'

import { useQuery } from '@tanstack/react-query'
import { getOutcomes, type Outcome } from '@/lib/api-client'

export function useApiOutcomes(planHash: string | null) {
  return useQuery<Outcome[]>({
    queryKey: ['api-outcomes', planHash],
    queryFn: () => (planHash ? getOutcomes(planHash) : []),
    enabled: !!planHash,
    initialData: [],
  })
}
