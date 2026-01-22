'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useApiUser(address: string | null) {
  return useQuery({
    queryKey: ['api-user', address],
    queryFn: () => apiFetch(`/api/users/${address}`),
    enabled: !!address,
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (avatarUrl: string) =>
      apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify({ avatarUrl }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-user'] }),
  })
}
