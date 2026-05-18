import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import apiFetch from '../../api/client';

interface CalendarAccount {
  id: string;
  name: string;
  provider: string;
}

interface GoogleStartResponse {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  qrDataUrl: string;
  expiresIn: number;
}

type PollStatus = 'pending' | 'success' | 'expired' | 'error';

interface PollResponse {
  status: PollStatus;
}

interface BasicForm {
  username: string;
  password: string;
  provider: 'apple' | 'yahoo';
}

interface CalendarsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function CalendarsStep({ onNext, onSkip }: CalendarsStepProps) {
  const qc = useQueryClient();
  const [googleFlow, setGoogleFlow] = useState<GoogleStartResponse | null>(null);
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null);
  const [showBasicForm, setShowBasicForm] = useState(false);
  const [basicForm, setBasicForm] = useState<BasicForm>({
    username: '',
    password: '',
    provider: 'apple',
  });
  const [basicError, setBasicError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: accounts = [] } = useQuery<CalendarAccount[]>({
    queryKey: ['calendar-accounts'],
    queryFn: () => apiFetch('/api/v1/calendar/accounts'),
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/calendar/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar-accounts'] }); },
  });

  const googleStartMut = useMutation({
    mutationFn: () =>
      apiFetch<GoogleStartResponse>('/api/v1/calendar/accounts/google/start', { method: 'POST' }),
    onSuccess: (data) => {
      setGoogleFlow(data);
      setPollStatus('pending');
    },
  });

  const basicTestMut = useMutation({
    mutationFn: (form: BasicForm) =>
      apiFetch('/api/v1/calendar/accounts/basic/test', { method: 'POST', body: form }),
  });

  const basicSaveMut = useMutation({
    mutationFn: (form: BasicForm) =>
      apiFetch('/api/v1/calendar/accounts/basic', { method: 'POST', body: form }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-accounts'] });
      setShowBasicForm(false);
      setBasicForm({ username: '', password: '', provider: 'apple' });
      setBasicError('');
    },
  });

  useEffect(() => {
    if (!googleFlow || pollStatus !== 'pending') return () => {};

    const { deviceCode } = googleFlow;
    let elapsed = 0;
    const maxSeconds = 300;

    pollRef.current = setInterval(() => {
      elapsed += 5;
      if (elapsed < maxSeconds) {
        void apiFetch<PollResponse>(`/api/v1/calendar/accounts/google/poll/${deviceCode}`)
          .then((res) => {
            if (res.status === 'success') {
              setPollStatus('success');
              setGoogleFlow(null);
              clearInterval(pollRef.current!);
              void qc.invalidateQueries({ queryKey: ['calendar-accounts'] });
            } else if (res.status === 'expired' || res.status === 'error') {
              setPollStatus(res.status);
              setGoogleFlow(null);
              clearInterval(pollRef.current!);
            }
          })
          .catch(() => {
            // silently retry
          });
      } else {
        setPollStatus('expired');
        setGoogleFlow(null);
        clearInterval(pollRef.current!);
      }
    }, 5000);

    return () => clearInterval(pollRef.current!);
  }, [googleFlow, pollStatus, qc]);

  async function handleBasicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBasicError('');
    try {
      await basicTestMut.mutateAsync(basicForm);
      basicSaveMut.mutate(basicForm);
    } catch {
      setBasicError('Could not connect — check your username and app password.');
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">
        Connect your calendar accounts. You can skip this and add them later.
      </p>

      <div className="space-y-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-neutral-100 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-primary truncate">{acc.name}</p>
              <p className="text-caption text-secondary capitalize">{acc.provider}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteMut.mutate(acc.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
              aria-label={`Remove ${acc.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {!googleFlow && !showBasicForm && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => googleStartMut.mutate()}
            disabled={googleStartMut.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 text-secondary hover:border-neutral-400 hover:text-primary transition-colors flex-1 justify-center"
          >
            <Plus size={16} />
            {googleStartMut.isPending ? 'Starting…' : 'Add Google Calendar'}
          </button>
          <button
            type="button"
            onClick={() => setShowBasicForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 text-secondary hover:border-neutral-400 hover:text-primary transition-colors flex-1 justify-center"
          >
            <Plus size={16} />
            Add Apple / Yahoo
          </button>
        </div>
      )}

      {googleFlow && pollStatus === 'pending' && (
        <div className="border border-neutral-200 rounded-2xl p-4 space-y-3 bg-neutral-50 text-center">
          <p className="text-body font-semibold text-primary">Scan to authorise Google Calendar</p>
          {googleFlow.qrDataUrl && (
            <img
              src={googleFlow.qrDataUrl}
              alt="Google Calendar QR code"
              className="mx-auto w-40 h-40 rounded-xl"
            />
          )}
          <p className="text-caption text-secondary">
            Or visit{' '}
            <a
              href={googleFlow.verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              {googleFlow.verificationUrl}
            </a>{' '}
            and enter code <strong>{googleFlow.userCode}</strong>
          </p>
          <p className="text-caption text-neutral-400">Waiting for authorisation…</p>
          <button
            type="button"
            onClick={() => {
              setGoogleFlow(null);
              setPollStatus(null);
              clearInterval(pollRef.current!);
            }}
            className="text-caption text-secondary underline"
          >
            Cancel
          </button>
        </div>
      )}

      {pollStatus === 'success' && (
        <p className="text-caption text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          Google Calendar connected successfully.
        </p>
      )}

      {(pollStatus === 'expired' || pollStatus === 'error') && (
        <p className="text-caption text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Authorisation failed or timed out. Please try again.
        </p>
      )}

      {showBasicForm && (
        <form
          onSubmit={(e) => { void handleBasicSubmit(e); }}
          className="border border-neutral-200 rounded-2xl p-4 space-y-3 bg-neutral-50"
        >
          <h3 className="text-body font-semibold text-primary">Add Apple / Yahoo Calendar</h3>

          <div className="flex gap-2">
            {(['apple', 'yahoo'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBasicForm((f) => ({ ...f, provider: p }))}
                className={`px-3 py-1.5 rounded-xl border text-caption font-medium capitalize transition-colors ${
                  basicForm.provider === p
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'border-neutral-200 text-secondary hover:border-neutral-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-caption font-medium text-secondary mb-1">Username / Email</label>
            <input
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
              value={basicForm.username}
              onChange={(e) => setBasicForm((f) => ({ ...f, username: e.target.value }))}
              required
              placeholder="user@example.com"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-caption font-medium text-secondary mb-1">App password</label>
            <input
              type="password"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
              value={basicForm.password}
              onChange={(e) => setBasicForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="App-specific password"
            />
          </div>

          {basicError && (
            <p className="text-caption text-red-600">{basicError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={basicTestMut.isPending || basicSaveMut.isPending}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-body font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {basicTestMut.isPending || basicSaveMut.isPending ? 'Connecting…' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowBasicForm(false);
                setBasicForm({ username: '', password: '', provider: 'apple' });
                setBasicError('');
              }}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-body text-secondary hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="pt-2 flex justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="px-5 py-2.5 rounded-button font-medium text-secondary hover:bg-neutral-100 transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  );
}
