import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAlerts, dismissAlert, type Alert } from '../api/alerts';
import { useWebSocket } from './useWebSocket';

export const ALERTS_KEY = ['alerts'] as const;

export function useAlerts() {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.event === 'alert_update') {
      void queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    }
  }, [lastMessage, queryClient]);

  return useQuery<Alert[]>({
    queryKey: ALERTS_KEY,
    queryFn: getAlerts,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dismissAlert(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ALERTS_KEY });
      const previous = queryClient.getQueryData<Alert[]>(ALERTS_KEY);
      queryClient.setQueryData<Alert[]>(ALERTS_KEY, (old) =>
        (old ?? []).filter((a) => a.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ALERTS_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}
