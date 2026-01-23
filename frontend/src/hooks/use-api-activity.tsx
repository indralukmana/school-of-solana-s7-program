'use client'

import { useQuery } from '@tanstack/react-query'
import { getActivity, type ActivityEvent } from '@/lib/api-client'

export type { ActivityEvent }

export function useApiActivity(filter?: { actor?: string; vault?: string }) {
  return useQuery<ActivityEvent[]>({
    queryKey: ['api-activity', filter],
    queryFn: () => getActivity(filter),
    initialData: [],
  })
}
