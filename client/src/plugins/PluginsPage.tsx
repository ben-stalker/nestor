import { useState } from 'react';
import RiskBadge from './components/RiskBadge';
import PluginSettingsModal from './components/PluginSettingsModal';
import {
  useCommunityPlugins,
  useDisablePlugin,
  useEnablePlugin,
  useInstallCommunityPlugin,
  usePlugins,
  useRestartPlugin,
} from './hooks/usePlugins';
import type { PluginInfo } from './types';

type Tab = 'installed' | 'community';

function StatusBadge({ status }: { status: PluginInfo['status'] }) {
  if (status === 'enabled')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-caption text-green-800">Enabled</span>;
  if (status === 'error')
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-caption text-red-800">Error</span>;
  return <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-secondary">Disabled</span>;
}

function InstalledTab() {
  const { data, isLoading, error } = usePlugins();
  const enable = useEnablePlugin();
  const disable = useDisablePlugin();
  const restart = useRestartPlugin();
  const [configuring, setConfiguring] = useState<PluginInfo | null>(null);

  if (isLoading) return <p className="p-4 text-secondary">Loading…</p>;
  if (error) return <p className="p-4 text-alert-urgent">Failed to load plugins</p>;
  if (!data || data.length === 0) {
    return <p className="p-4 text-secondary">No plugins installed.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((plugin) => {
        const enabled = plugin.status === 'enabled';
        return (
          <div
            key={plugin.id}
            data-testid={`plugin-row-${plugin.id}`}
            className="rounded-card border border-neutral-200 bg-surface-elev p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-h3 font-semibold text-primary">{plugin.name}</h3>
                  <RiskBadge risk={plugin.apiRisk} />
                  <StatusBadge status={plugin.status} />
                </div>
                <p className="mt-1 text-caption text-secondary">{plugin.description}</p>
                <p className="mt-0.5 text-caption text-secondary">
                  v{plugin.version} · {plugin.author}
                </p>
                {plugin.errorMessage && (
                  <p className="mt-2 text-caption text-alert-urgent" role="alert">
                    {plugin.errorMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    enabled ? disable.mutate(plugin.id) : enable.mutate(plugin.id)
                  }
                  className={`rounded-button px-3 py-1 text-caption font-medium ${
                    enabled
                      ? 'bg-neutral-100 text-secondary hover:bg-neutral-200'
                      : 'bg-mode-house text-white hover:opacity-90'
                  }`}
                >
                  {enabled ? 'Disable' : 'Enable'}
                </button>
                {plugin.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => restart.mutate(plugin.id)}
                    className="rounded-button bg-orange-100 px-3 py-1 text-caption font-medium text-orange-800 hover:bg-orange-200"
                  >
                    Restart
                  </button>
                )}
                {plugin.settingsFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfiguring(plugin)}
                    className="rounded-button border border-neutral-300 px-3 py-1 text-caption text-secondary hover:bg-neutral-100"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {configuring && (
        <PluginSettingsModal plugin={configuring} onClose={() => setConfiguring(null)} />
      )}
    </div>
  );
}

function CommunityTab() {
  const { data, isLoading } = useCommunityPlugins();
  const install = useInstallCommunityPlugin();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (isLoading) return <p className="p-4 text-secondary">Loading…</p>;
  if (!data || !data.configured) {
    return (
      <p className="p-4 text-secondary">
        Community plugin index URL not configured. Set <code>community_plugin_index_url</code> in app settings.
      </p>
    );
  }
  if (data.plugins.length === 0) {
    return <p className="p-4 text-secondary">No community plugins listed.</p>;
  }

  return (
    <div className="space-y-3">
      {data.plugins.map((p) => (
        <div
          key={p.id}
          className="rounded-card border border-neutral-200 bg-surface-elev p-4"
          data-testid={`community-row-${p.id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-h3 font-semibold text-primary">{p.name}</h3>
                <RiskBadge risk={p.apiRisk} />
              </div>
              <p className="mt-1 text-caption text-secondary">{p.description}</p>
              <p className="mt-0.5 text-caption text-secondary">by {p.author}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirming(p.id)}
              className="rounded-button border border-neutral-300 px-3 py-1 text-caption text-secondary hover:bg-neutral-100"
            >
              Install
            </button>
          </div>
          {confirming === p.id && (
            <div role="dialog" aria-modal="true" className="mt-3 rounded-card bg-yellow-50 p-3">
              <p className="text-caption text-yellow-900">
                Community plugin — review code before enabling.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    install.mutate({ id: p.id, repoUrl: p.repoUrl });
                    setConfirming(null);
                  }}
                  className="rounded-button bg-yellow-200 px-3 py-1 text-caption font-medium text-yellow-900"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-button px-3 py-1 text-caption text-secondary hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PluginsPage() {
  const [tab, setTab] = useState<Tab>('installed');

  return (
    <main className="space-y-4 p-4">
      <header>
        <h1 className="text-h1 font-semibold text-primary">Plugins</h1>
      </header>
      <div role="tablist" aria-label="Plugin tabs" className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'installed'}
          onClick={() => setTab('installed')}
          className={`px-3 py-2 text-caption font-medium ${
            tab === 'installed' ? 'border-b-2 border-mode-house text-primary' : 'text-secondary'
          }`}
        >
          Installed
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'community'}
          onClick={() => setTab('community')}
          className={`px-3 py-2 text-caption font-medium ${
            tab === 'community' ? 'border-b-2 border-mode-house text-primary' : 'text-secondary'
          }`}
        >
          Browse Community
        </button>
      </div>
      {tab === 'installed' ? <InstalledTab /> : <CommunityTab />}
    </main>
  );
}
