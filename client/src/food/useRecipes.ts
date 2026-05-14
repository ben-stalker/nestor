import { useQuery } from '@tanstack/react-query';
import { getRecipes, getRecipe } from './api';

export function useRecipes(search?: string, tags?: string[]) {
  return useQuery({
    queryKey: ['recipes', search, tags],
    queryFn: () => getRecipes(search, tags),
    staleTime: 5 * 60_000,
  });
}

export function useRecipe(id: number | null) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  });
}
