import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  clearPluginRegistry,
  loadManifestFile,
  scanPluginsDirectory,
  pluginRegistry,
  listPlugins,
  markStatus,
} from '../../src/services/pluginLoader';

function makeTempPluginsDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nestor-plugins-'));
}

function writeManifest(dir: string, id: string, body: Record<string, unknown>): void {
  const sub = path.join(dir, id);
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(sub, 'manifest.json'), JSON.stringify(body), 'utf8');
}

describe('pluginLoader', () => {
  beforeEach(() => {
    clearPluginRegistry();
  });

  it('returns empty result when plugins dir does not exist', () => {
    const result = scanPluginsDirectory(path.join(os.tmpdir(), 'nestor-does-not-exist-xyz'));
    expect(result.loaded).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it('loads a valid manifest', () => {
    const dir = makeTempPluginsDir();
    writeManifest(dir, 'test-plugin', {
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      author: 'Nestor',
      capabilities: ['home_screen_widget'],
      apiRisk: 'official',
    });
    const result = scanPluginsDirectory(dir);
    expect(result.loaded).toHaveLength(1);
    expect(result.loaded[0].id).toBe('test-plugin');
    expect(pluginRegistry.get('test-plugin')?.status).toBe('disabled');
  });

  it('skips a directory without manifest', () => {
    const dir = makeTempPluginsDir();
    fs.mkdirSync(path.join(dir, 'no-manifest'));
    const result = scanPluginsDirectory(dir);
    expect(result.loaded).toEqual([]);
    expect(result.skipped[0].reason).toBe('no-manifest');
  });

  it('skips a malformed manifest and continues', () => {
    const dir = makeTempPluginsDir();
    fs.mkdirSync(path.join(dir, 'broken'));
    fs.writeFileSync(path.join(dir, 'broken', 'manifest.json'), '{ not json', 'utf8');
    writeManifest(dir, 'ok', {
      id: 'ok',
      name: 'OK',
      version: '0.1.0',
      author: 'Nestor',
    });
    const result = scanPluginsDirectory(dir);
    expect(result.loaded).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('invalid-manifest');
  });

  it('rejects manifest missing required fields', () => {
    const dir = makeTempPluginsDir();
    writeManifest(dir, 'bad', { id: 'bad' });
    const result = scanPluginsDirectory(dir);
    expect(result.loaded).toHaveLength(0);
    expect(result.skipped[0].reason).toBe('invalid-manifest');
  });

  it('listPlugins reflects registered plugins', () => {
    const dir = makeTempPluginsDir();
    writeManifest(dir, 'a', { id: 'a', name: 'A', version: '0.1.0', author: 'X' });
    writeManifest(dir, 'b', { id: 'b', name: 'B', version: '0.1.0', author: 'X' });
    scanPluginsDirectory(dir);
    expect(
      listPlugins()
        .map((p) => p.manifest.id)
        .sort(),
    ).toEqual(['a', 'b']);
  });

  it('markStatus updates status and error message', () => {
    const dir = makeTempPluginsDir();
    writeManifest(dir, 'x', { id: 'x', name: 'X', version: '0.1.0', author: 'Y' });
    scanPluginsDirectory(dir);
    markStatus('x', 'error', 'boom');
    expect(pluginRegistry.get('x')?.status).toBe('error');
    expect(pluginRegistry.get('x')?.errorMessage).toBe('boom');
  });

  it('loadManifestFile returns null on missing file', () => {
    expect(loadManifestFile('/no/such/file.json')).toBeNull();
  });
});
