import { z } from 'zod';

export const PluginCapabilitySchema = z.enum([
  'home_screen_widget',
  'alert_source',
  'tts_announcements',
  'settings_panel',
  'voice_handler',
  'nav_mode',
  'sidebar_filter',
  'calendar_source',
]);
export type PluginCapability = z.infer<typeof PluginCapabilitySchema>;

export const PluginApiRiskSchema = z.enum(['official', 'community', 'unofficial']);
export type PluginApiRisk = z.infer<typeof PluginApiRiskSchema>;

export const SettingFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'password', 'number', 'toggle', 'textarea']),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
});
export type SettingField = z.infer<typeof SettingFieldSchema>;

export const PluginManifestSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_][a-z0-9_-]*$/, 'Plugin id must be lowercase alphanumeric with - or _'),
  name: z.string().min(1).max(120),
  version: z.string().min(1).max(32),
  author: z.string().min(1).max(120),
  description: z.string().max(2000).default(''),
  capabilities: z.array(PluginCapabilitySchema).default([]),
  settingsFields: z.array(SettingFieldSchema).default([]),
  apiRisk: PluginApiRiskSchema.default('community'),
  entry: z.string().default('index.js'),
});
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export type PluginStatus = 'disabled' | 'enabled' | 'error';

export interface PluginRegistryEntry {
  manifest: PluginManifest;
  status: PluginStatus;
  errorMessage?: string;
  dir: string;
}

export interface CommunityPluginEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  apiRisk: PluginApiRisk;
  repoUrl?: string;
  homepageUrl?: string;
}
