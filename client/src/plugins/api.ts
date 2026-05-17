import apiFetch from '../api/client';
import type { PluginInfo, PluginRegistrySnapshot, CommunityIndexResponse } from './types';

export const PLUGINS_QUERY_KEY = ['plugins'] as const;
export const PLUGIN_REGISTRIES_QUERY_KEY = ['plugin-registries'] as const;
export const PLUGIN_COMMUNITY_QUERY_KEY = ['plugin-community'] as const;
export const pluginSettingsQueryKey = (id: string): readonly unknown[] =>
  ['plugin-settings', id] as const;

export function listPlugins(): Promise<PluginInfo[]> {
  return apiFetch<PluginInfo[]>('/api/v1/plugins');
}

export function getRegistries(): Promise<PluginRegistrySnapshot> {
  return apiFetch<PluginRegistrySnapshot>('/api/v1/plugins/registries');
}

export function getCommunity(): Promise<CommunityIndexResponse> {
  return apiFetch<CommunityIndexResponse>('/api/v1/plugins/community');
}

export function enablePlugin(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/plugins/${encodeURIComponent(id)}/enable`, { method: 'POST' });
}

export function disablePlugin(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/plugins/${encodeURIComponent(id)}/disable`, { method: 'POST' });
}

export function restartPlugin(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/plugins/${encodeURIComponent(id)}/restart`, { method: 'POST' });
}

export function getPluginSettings(id: string): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>(`/api/v1/plugins/${encodeURIComponent(id)}/settings`);
}

export function savePluginSettings(id: string, body: Record<string, string>): Promise<void> {
  return apiFetch<void>(`/api/v1/plugins/${encodeURIComponent(id)}/settings`, {
    method: 'PUT',
    body,
  });
}

export function installCommunityPlugin(id: string, repoUrl?: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/v1/plugins/community/install', {
    method: 'POST',
    body: { id, repoUrl },
  });
}
