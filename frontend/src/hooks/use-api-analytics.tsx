'use client'

import { useQuery } from '@tanstack/react-query'
import { getAnalytics, type AnalyticsResponse } from '@/lib/api-client'

export function useApiAnalytics(owner: string | null) {
  return useQuery<AnalyticsResponse>({
    queryKey: ['api-analytics', owner],
    queryFn: () => getAnalytics(owner!),
    enabled: !!owner,
    staleTime: 30_000,
  })
}
