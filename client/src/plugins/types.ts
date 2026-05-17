export type PluginCapability =
  | 'home_screen_widget'
  | 'alert_source'
  | 'tts_announcements'
  | 'settings_panel'
  | 'voice_handler'
  | 'nav_mode'
  | 'sidebar_filter'
  | 'calendar_source';

export type PluginApiRisk = 'official' | 'community' | 'unofficial';

export type PluginStatus = 'disabled' | 'enabled' | 'error';

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'toggle' | 'textarea';
  default?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  capabilities: PluginCapability[];
  settingsFields: SettingField[];
  apiRisk: PluginApiRisk;
  status: PluginStatus;
  errorMessage?: string;
}

export interface WidgetDef {
  pluginId: string;
  id: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
  data?: unknown;
}

export interface NavModeDef {
  pluginId: string;
  id: string;
  label: string;
  icon?: string;
  accent?: string;
  route?: string;
}

export interface FilterDef {
  pluginId: string;
  id: string;
  label: string;
  group?: string;
}

export interface PluginRegistrySnapshot {
  widgets: WidgetDef[];
  navModes: NavModeDef[];
  sidebarFilters: FilterDef[];
  voiceHandlers: { pluginId: string; id: string; description?: string }[];
  calendarSystems: { pluginId: string; id: string; label: string }[];
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

export interface CommunityIndexResponse {
  configured: boolean;
  plugins: CommunityPluginEntry[];
}
