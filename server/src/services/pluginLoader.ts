import fs from 'node:fs';
import path from 'node:path';
import {
  PluginManifestSchema,
  type PluginManifest,
  type PluginRegistryEntry,
} from '../types/plugins';
import logger from '../utils/logger';

const DEFAULT_PLUGINS_DIR = path.resolve(__dirname, '..', '..', '..', 'plugins');

export const pluginRegistry = new Map<string, PluginRegistryEntry>();

export function clearPluginRegistry(): void {
  pluginRegistry.clear();
}

export function loadManifestFile(manifestPath: string): PluginManifest | null {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const result = PluginManifestSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn(
        { manifestPath, issues: result.error.issues },
        'pluginLoader: invalid manifest, skipping',
      );
      return null;
    }
    return result.data;
  } catch (err) {
    logger.warn({ err, manifestPath }, 'pluginLoader: failed to read manifest');
    return null;
  }
}

export interface ScanResult {
  loaded: PluginManifest[];
  skipped: { dir: string; reason: string }[];
}

export function scanPluginsDirectory(pluginsDir: string = DEFAULT_PLUGINS_DIR): ScanResult {
  const result: ScanResult = { loaded: [], skipped: [] };

  if (!fs.existsSync(pluginsDir)) {
    logger.debug({ pluginsDir }, 'pluginLoader: plugins directory does not exist');
    return result;
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  entries.forEach((dirent) => {
    if (!dirent.isDirectory()) return;
    const dir = path.join(pluginsDir, dirent.name);
    const manifestPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      result.skipped.push({ dir, reason: 'no-manifest' });
      return;
    }
    const manifest = loadManifestFile(manifestPath);
    if (!manifest) {
      result.skipped.push({ dir, reason: 'invalid-manifest' });
      return;
    }
    if (manifest.id !== dirent.name) {
      logger.warn(
        { dir: dirent.name, manifestId: manifest.id },
        'pluginLoader: manifest id does not match directory name',
      );
    }
    pluginRegistry.set(manifest.id, {
      manifest,
      status: 'disabled',
      dir,
    });
    result.loaded.push(manifest);
  });

  logger.info(
    { loaded: result.loaded.length, skipped: result.skipped.length },
    'pluginLoader: scan complete',
  );
  return result;
}

export function getPlugin(id: string): PluginRegistryEntry | undefined {
  return pluginRegistry.get(id);
}

export function listPlugins(): PluginRegistryEntry[] {
  return Array.from(pluginRegistry.values());
}

export function markStatus(
  id: string,
  status: PluginRegistryEntry['status'],
  errorMessage?: string,
): void {
  const entry = pluginRegistry.get(id);
  if (!entry) return;
  entry.status = status;
  entry.errorMessage = errorMessage;
}

export { DEFAULT_PLUGINS_DIR };
