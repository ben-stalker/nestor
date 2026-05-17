import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Upload, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import apiFetch from '../api/client';
import Button from '../shared/ui/Button';

interface VersionInfo {
  version: string;
  updateAvailable: string | null;
}

interface ServiceStatus {
  available: boolean;
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle size={20} />
          <span className="font-semibold text-body">Are you sure?</span>
        </div>
        <p className="text-body text-secondary">{message}</p>
        <p className="text-caption text-secondary">
          Type <strong>RESET</strong> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="RESET"
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={confirmText !== 'RESET'}
            className="flex-1 !bg-red-600 hover:!bg-red-700"
          >
            Factory Reset
          </Button>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function serviceStatusLabel(available: boolean | null): string {
  if (available === null) return 'Checking…';
  return available ? 'Running' : 'Not installed';
}

function serviceStatusColour(available: boolean | null): string {
  return available ? 'bg-green-500' : 'bg-neutral-300';
}

function ServiceRow({
  name,
  available,
  docsHref,
}: {
  name: string;
  available: boolean | null;
  docsHref: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100 shadow-sm">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${serviceStatusColour(available)}`} />
      <span className="flex-1 text-body text-primary">{name}</span>
      <span className="text-caption text-secondary">{serviceStatusLabel(available)}</span>
      <a
        href={docsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-secondary hover:text-primary transition-colors"
        aria-label={`${name} docs`}
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export default function SystemPanel() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreOk, setRestoreOk] = useState(false);

  const { data: versionInfo, refetch: refetchVersion } = useQuery<VersionInfo>({
    queryKey: ['system-version'],
    queryFn: () => apiFetch('/api/v1/system/version'),
    staleTime: 60_000,
  });

  const { data: tailscale } = useQuery<ServiceStatus>({
    queryKey: ['system-tailscale'],
    queryFn: () => apiFetch('/api/v1/system/tailscale'),
    retry: false,
    staleTime: 30_000,
  });

  const { data: syncthing } = useQuery<ServiceStatus>({
    queryKey: ['system-syncthing'],
    queryFn: () => apiFetch('/api/v1/system/syncthing'),
    retry: false,
    staleTime: 30_000,
  });

  const updateMut = useMutation({
    mutationFn: () => apiFetch('/api/v1/system/update', { method: 'POST' }),
    onSuccess: () => {
      void refetchVersion();
    },
  });

  const resetMut = useMutation({
    mutationFn: () => apiFetch('/api/v1/system/factory-reset', { method: 'POST' }),
    onSuccess: () => {
      window.location.reload();
    },
  });

  function downloadBackup() {
    window.open('/api/v1/system/backup', '_blank');
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    setRestoreError(null);
    setRestoreOk(false);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      await apiFetch('/api/v1/system/restore', { method: 'POST', body: parsed });
      setRestoreOk(true);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Restore failed');
    }
    e.target.value = '';
  }

  function onRestoreChange(e: React.ChangeEvent<HTMLInputElement>) {
    void handleRestore(e);
  }

  return (
    <div className="space-y-8 max-w-lg">
      {showResetConfirm && (
        <ConfirmDialog
          message="This will permanently wipe all data, profiles, calendar accounts, and settings. The app will restart to a blank state. This cannot be undone."
          onConfirm={() => {
            setShowResetConfirm(false);
            resetMut.mutate();
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Version */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Version</h3>
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex-1">
            <p className="text-body font-semibold text-primary">{versionInfo?.version ?? '—'}</p>
            {versionInfo?.updateAvailable ? (
              <p className="text-caption text-amber-600">
                Update available: v{versionInfo.updateAvailable}
              </p>
            ) : (
              <p className="text-caption text-green-600">Up to date</p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending}
          >
            <RefreshCw size={14} className={updateMut.isPending ? 'animate-spin' : ''} />
            {updateMut.isPending ? 'Updating…' : 'Update now'}
          </Button>
        </div>
      </section>

      {/* Backup */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Backup & restore</h3>
        <div className="space-y-2">
          <Button variant="secondary" onClick={downloadBackup} className="w-full">
            <Download size={14} /> Export backup JSON
          </Button>

          <label className="block">
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 text-body text-secondary cursor-pointer hover:bg-neutral-50 transition-colors">
              <Upload size={14} />
              Import backup JSON
            </div>
            <input type="file" accept=".json" className="sr-only" onChange={onRestoreChange} />
          </label>

          {restoreOk && (
            <p className="text-caption text-green-600">Backup restored successfully.</p>
          )}
          {restoreError && <p className="text-caption text-red-500">{restoreError}</p>}
        </div>
      </section>

      {/* Services */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-primary">Services (read-only)</h3>
        <div className="space-y-2">
          <ServiceRow
            name="Tailscale"
            available={tailscale?.available ?? null}
            docsHref="https://tailscale.com/kb/1017/install"
          />
          <ServiceRow
            name="Syncthing"
            available={syncthing?.available ?? null}
            docsHref="https://docs.syncthing.net/intro/getting-started.html"
          />
        </div>
      </section>

      {/* Factory reset */}
      <section className="space-y-3 border-t border-neutral-200 pt-6">
        <h3 className="text-body font-semibold text-red-500">Danger zone</h3>
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-3">
          <p className="text-caption text-red-700">
            Factory reset wipes ALL data — profiles, calendars, settings, and history. This cannot
            be undone.
          </p>
          <Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            disabled={resetMut.isPending}
            className="!border-red-300 !text-red-600 hover:!bg-red-100"
          >
            <AlertTriangle size={14} />
            {resetMut.isPending ? 'Resetting…' : 'Factory reset'}
          </Button>
        </div>
      </section>
    </div>
  );
}
