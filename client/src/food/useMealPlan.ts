import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealPlan, setMealPlanEntry, deleteMealPlanEntry } from './api';
import type { MealPlanEntryInput } from './api';

export function useMealPlan(start: string, end: string) {
  return useQuery({
    queryKey: ['meal-plan', start, end],
    queryFn: () => getMealPlan(start, end),
    staleTime: 5 * 60_000,
  });
}

export function useSetMealPlanEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MealPlanEntryInput) => setMealPlanEntry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
    },
  });
}

export function useDeleteMealPlanEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMealPlanEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
    },
  });
}
