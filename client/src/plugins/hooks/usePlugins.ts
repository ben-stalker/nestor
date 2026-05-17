import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PLUGINS_QUERY_KEY,
  PLUGIN_REGISTRIES_QUERY_KEY,
  PLUGIN_COMMUNITY_QUERY_KEY,
  pluginSettingsQueryKey,
  disablePlugin,
  enablePlugin,
  getCommunity,
  getPluginSettings,
  getRegistries,
  installCommunityPlugin,
  listPlugins,
  restartPlugin,
  savePluginSettings,
} from '../api';
import type { CommunityIndexResponse, PluginInfo, PluginRegistrySnapshot } from '../types';

export function usePlugins() {
  return useQuery<PluginInfo[]>({
    queryKey: PLUGINS_QUERY_KEY,
    queryFn: listPlugins,
    staleTime: 5_000,
  });
}

export function usePluginRegistries() {
  return useQuery<PluginRegistrySnapshot>({
    queryKey: PLUGIN_REGISTRIES_QUERY_KEY,
    queryFn: getRegistries,
    staleTime: 5_000,
  });
}

export function usePluginWidgets() {
  const query = usePluginRegistries();
  return { ...query, widgets: query.data?.widgets ?? [] };
}

export function usePluginNavModes() {
  const query = usePluginRegistries();
  return { ...query, navModes: query.data?.navModes ?? [] };
}

export function usePluginSidebarFilters() {
  const query = usePluginRegistries();
  return { ...query, filters: query.data?.sidebarFilters ?? [] };
}

export function useCommunityPlugins() {
  return useQuery<CommunityIndexResponse>({
    queryKey: PLUGIN_COMMUNITY_QUERY_KEY,
    queryFn: getCommunity,
    staleTime: 60_000,
  });
}

export function usePluginSettings(pluginId: string | null) {
  return useQuery<Record<string, string>>({
    queryKey: pluginSettingsQueryKey(pluginId ?? ''),
    queryFn: () => getPluginSettings(pluginId as string),
    enabled: !!pluginId,
  });
}

export function useEnablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enablePlugin(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PLUGINS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PLUGIN_REGISTRIES_QUERY_KEY });
    },
  });
}

export function useDisablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disablePlugin(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PLUGINS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PLUGIN_REGISTRIES_QUERY_KEY });
    },
  });
}

export function useRestartPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restartPlugin(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PLUGINS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PLUGIN_REGISTRIES_QUERY_KEY });
    },
  });
}

export function useSavePluginSettings(pluginId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, string>) => savePluginSettings(pluginId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pluginSettingsQueryKey(pluginId) });
    },
  });
}

export function useInstallCommunityPlugin() {
  return useMutation({
    mutationFn: ({ id, repoUrl }: { id: string; repoUrl?: string }) =>
      installCommunityPlugin(id, repoUrl),
  });
}
