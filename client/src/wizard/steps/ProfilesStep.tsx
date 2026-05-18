import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import apiFetch from '../../api/client';
import type { Profile } from '../../api/profiles';

const PROFILE_COLOURS = [
  '#6366f1',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#22c55e',
  '#3b82f6',
];

const PROFILE_TYPES = ['admin', 'teen', 'child'] as const;
type BasicProfileType = (typeof PROFILE_TYPES)[number];

interface NewProfileForm {
  name: string;
  type: BasicProfileType;
  colour: string;
}

function defaultForm(): NewProfileForm {
  return { name: '', type: 'admin', colour: '#6366f1' };
}

interface ProfilesStepProps {
  onNext: () => void;
}

export default function ProfilesStep({ onNext }: ProfilesStepProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewProfileForm>(defaultForm());
  const [error, setError] = useState('');

  const { data: rawProfiles } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: () => apiFetch('/api/v1/profiles'),
  });
  const profiles = Array.isArray(rawProfiles) ? rawProfiles : [];

  const createMut = useMutation({
    mutationFn: (body: NewProfileForm) => apiFetch('/api/v1/profiles', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] });
      setShowForm(false);
      setForm(defaultForm());
      setError('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/v1/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['profiles'] }); },
  });

  const hasAdmin = profiles.some((p) => p.type === 'admin');

  function handleNext() {
    if (!hasAdmin) {
      setError('At least one admin profile is required to continue.');
      return;
    }
    onNext();
  }

  function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMut.mutate(form);
  }

  return (
    <div className="space-y-5">
      <p className="text-body text-secondary">
        Set up profiles for your household members. You need at least one admin profile.
      </p>

      <div className="space-y-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-neutral-100 shadow-sm"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-body shrink-0"
              style={{ backgroundColor: p.colour }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-primary truncate">{p.name}</p>
              <p className="text-caption text-secondary capitalize">{p.type}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteMut.mutate(p.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
              aria-label={`Delete ${p.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {profiles.length === 0 && (
          <p className="text-caption text-secondary text-center py-4">No profiles yet.</p>
        )}
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 text-secondary hover:border-neutral-400 hover:text-primary transition-colors w-full justify-center"
        >
          <Plus size={16} />
          Add profile
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAddProfile}
          className="border border-neutral-200 rounded-2xl p-4 space-y-3 bg-neutral-50"
        >
          <h3 className="text-body font-semibold text-primary">New profile</h3>

          <div>
            <label className="block text-caption font-medium text-secondary mb-1">Name</label>
            <input
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={50}
              placeholder="e.g. Alice"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-caption font-medium text-secondary mb-1">Type</label>
            <div className="flex gap-2">
              {PROFILE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-xl border text-caption font-medium transition-colors capitalize ${
                    form.type === t
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 text-secondary hover:border-neutral-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium text-secondary mb-2">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {PROFILE_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colour: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    form.colour === c ? 'ring-2 ring-offset-1 ring-neutral-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createMut.isPending || !form.name.trim()}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-body font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMut.isPending ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(defaultForm());
              }}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-body text-secondary hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-caption text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {!hasAdmin && profiles.length > 0 && (
        <p className="text-caption text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Add an admin profile to continue.
        </p>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasAdmin}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-button font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
