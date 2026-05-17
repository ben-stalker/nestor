import { useState } from 'react';
import { Zap, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Button from '../shared/ui/Button';
import Skeleton from '../shared/ui/Skeleton';
import useAppStore from '../store/appStore';
import { useOctopusStatus, useSaveOctopusCredentials, useDeleteOctopusCredentials } from './api';

export default function OctopusSettings() {
  const adminPin = useAppStore((s) => s.adminPin);
  const { data: status, isLoading } = useOctopusStatus();
  const saveCredentials = useSaveOctopusCredentials();
  const deleteCredentials = useDeleteOctopusCredentials();

  const [apiKey, setApiKey] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    saveCredentials.mutate(
      { apiKey, accountNumber },
      {
        onSuccess: () => {
          setApiKey('');
          setAccountNumber('');
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to connect to Octopus Energy';
          setError(message);
        },
      },
    );
  }

  function handleDisconnect() {
    setError('');
    deleteCredentials.mutate(undefined, {
      onError: () => setError('Failed to disconnect'),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
      </div>
    );
  }

  const configured = status?.configured ?? false;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-mode-ev" />
        <span className="text-body font-semibold">Octopus Energy</span>
      </div>

      {configured ? (
        <div className="space-y-4">
          <div className="p-4 rounded-card bg-surface border border-neutral-200 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={18} />
              <span className="text-body font-medium">Connected</span>
            </div>

            <div className="space-y-2">
              {status?.accountNumber && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">Account</span>
                  <span className="font-medium">{status.accountNumber}</span>
                </div>
              )}
              {status?.mpan && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">MPAN</span>
                  <span className="font-medium">{status.mpan}</span>
                </div>
              )}
              {status?.meterSerial && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">Electricity meter</span>
                  <span className="font-medium">{status.meterSerial}</span>
                </div>
              )}
              {status?.gasMprn && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">MPRN</span>
                  <span className="font-medium">{status.gasMprn}</span>
                </div>
              )}
              {status?.gasMeterSerial && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">Gas meter</span>
                  <span className="font-medium">{status.gasMeterSerial}</span>
                </div>
              )}
              {status?.tariffCode && (
                <div className="flex items-center justify-between text-caption">
                  <span className="text-secondary">Tariff</span>
                  <span className="font-medium">{status.tariffCode}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-urgent text-caption">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {adminPin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              loading={deleteCredentials.isPending}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Disconnect
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-caption text-secondary">
            Connect your Octopus Energy account to enable live electricity and gas consumption data.
          </p>

          {adminPin ? (
            <form
              onSubmit={handleConnect}
              className="space-y-3 p-4 rounded-card bg-surface border border-neutral-200"
            >
              <div>
                <label className="block text-caption text-secondary mb-1">API Key</label>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="sk_live_..."
                  className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-white"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-caption text-secondary mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="A-XXXXXXXX"
                  className="w-full rounded-button border border-neutral-200 px-3 py-2 text-body bg-white"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-urgent text-caption">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="sm" loading={saveCredentials.isPending}>
                Connect
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-card bg-surface border border-neutral-100 text-caption text-secondary">
              Admin access required to connect Octopus Energy.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
