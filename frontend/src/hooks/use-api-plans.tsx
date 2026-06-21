'use client'

import { useQuery } from '@tanstack/react-query'
import { getPlan, getPlans, type PlanRecord } from '@/lib/api-client'

export function useApiPlan(planHash: string | null) {
  return useQuery<PlanRecord | null>({
    queryKey: ['api-plan', planHash],
    queryFn: () => (planHash ? getPlan(planHash) : null),
    enabled: !!planHash,
  })
}

export function useApiPlans(filter?: { owner?: string; tag?: string }) {
  return useQuery<PlanRecord[]>({
    queryKey: ['api-plans', filter],
    queryFn: () => getPlans(filter ?? {}),
    enabled: !!filter?.owner,
  })
}
