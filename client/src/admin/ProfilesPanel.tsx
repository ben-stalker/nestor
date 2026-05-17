import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import apiFetch from '../api/client';
import type { Profile } from '../api/profiles';
import Button from '../shared/ui/Button';
import Modal from '../shared/ui/Modal';

const ALL_PERMISSIONS = [
  'view_calendar',
  'add_calendar_event',
  'edit_calendar_event',
  'delete_calendar_event',
  'view_food',
  'add_recipe',
  'add_to_shopping',
  'tick_shopping',
  'clear_shopping',
  'view_vehicles',
  'book_vehicle',
  'manage_vehicles',
  'view_chores',
  'complete_chore',
  'manage_chores',
  'view_health_log',
  'add_health_log',
  'view_finance',
  'manage_finance',
  'view_house',
  'manage_house',
  'view_pets',
  'manage_pets',
  'view_board',
  'post_board_message',
  'view_contacts',
  'manage_contacts',
  'manage_settings',
  'manage_plugins',
] as const;

const PROFILE_TYPES = [
  'admin',
  'teen',
  'child',
  'toddler',
  'baby',
  'grandparent',
  'guest',
] as const;

const PROFILE_COLOURS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#06b6d4',
  '#64748b',
  '#1e293b',
];

interface ProfileFormData {
  name: string;
  type: string;
  colour: string;
  pin?: string;
  text_size: string;
  simplified_nav: number;
  permissions_json: Record<string, boolean>;
}

function defaultForm(): ProfileFormData {
  return {
    name: '',
    type: 'admin',
    colour: '#6366f1',
    pin: '',
    text_size: 'default',
    simplified_nav: 0,
    permissions_json: {},
  };
}

function ProfileForm({
  initial,
  onSave,
  onClose,
}: {
  initial: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [showPerms, setShowPerms] = useState(false);

  function toggle(perm: string) {
    setForm((f) => ({
      ...f,
      permissions_json: { ...f.permissions_json, [perm]: !f.permissions_json[perm] },
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-caption font-medium text-secondary mb-1">Name</label>
        <input
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          maxLength={50}
          placeholder="e.g. Alice"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Type</label>
          <select
            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {PROFILE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Text size</label>
          <select
            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar bg-white"
            value={form.text_size}
            onChange={(e) => setForm((f) => ({ ...f, text_size: e.target.value }))}
          >
            {['small', 'default', 'large', 'xlarge'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-caption font-medium text-secondary mb-2">Colour</label>
        <div className="flex flex-wrap gap-2">
          {PROFILE_COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, colour: c }))}
              className={`w-7 h-7 rounded-full transition-transform ${form.colour === c ? 'ring-2 ring-offset-1 ring-neutral-900 scale-110' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-caption font-medium text-secondary">Simplified nav</label>
        <input
          type="checkbox"
          checked={form.simplified_nav === 1}
          onChange={(e) => setForm((f) => ({ ...f, simplified_nav: e.target.checked ? 1 : 0 }))}
          className="w-4 h-4 rounded accent-mode-calendar"
        />
      </div>

      <div>
        <label className="block text-caption font-medium text-secondary mb-1">
          PIN (leave blank to keep existing)
        </label>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-body outline-none focus:ring-2 focus:ring-mode-calendar"
          value={form.pin ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
          placeholder="4-digit PIN"
        />
      </div>

      <button
        type="button"
        className="flex items-center gap-1 text-caption text-mode-calendar font-medium"
        onClick={() => setShowPerms((v) => !v)}
      >
        {showPerms ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Permission overrides
      </button>

      {showPerms && (
        <div className="border border-neutral-100 rounded-xl p-3 grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-caption cursor-pointer">
              <input
                type="checkbox"
                checked={form.permissions_json[perm] ?? false}
                onChange={() => toggle(perm)}
                className="w-3.5 h-3.5 rounded accent-mode-calendar"
              />
              <span className="text-secondary">{perm.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="primary" className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ProfilesPanel() {
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: () => apiFetch('/api/v1/profiles'),
  });

  const [editing, setEditing] = useState<Profile | null | 'new'>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  const createMut = useMutation({
    mutationFn: (body: ProfileFormData) => apiFetch('/api/v1/profiles', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] });
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProfileFormData }) =>
      apiFetch(`/api/v1/profiles/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/v1/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  function handleSave(data: ProfileFormData) {
    if (editing === 'new') {
      createMut.mutate(data);
    } else if (editing) {
      updateMut.mutate({ id: editing.id, body: data });
    }
  }

  function initialForEdit(p: Profile): ProfileFormData {
    return {
      name: p.name,
      type: p.type,
      colour: p.colour,
      pin: '',
      text_size: p.text_size ?? 'default',
      simplified_nav: p.simplified_nav ?? 0,
      permissions_json: p.permissions_json ?? {},
    };
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus size={14} /> Add profile
        </Button>
      </div>

      <div className="space-y-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-body shrink-0"
              style={{ backgroundColor: p.colour }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-primary truncate">{p.name}</p>
              <p className="text-caption text-secondary">
                {p.type}
                {p.pinSet ? ' · PIN set' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(p)}
              className="p-2 rounded-lg hover:bg-neutral-100 text-secondary transition-colors"
              aria-label={`Edit ${p.name}`}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(p)}
              className="p-2 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
              aria-label={`Delete ${p.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {confirmDelete !== null && (
        <Modal open onClose={() => setConfirmDelete(null)}>
          <h2 className="text-h2 font-semibold text-primary mb-4">Delete {confirmDelete.name}?</h2>
          <p className="text-body text-secondary mb-4">This will permanently remove the profile.</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1 !bg-red-600 hover:!bg-red-700"
              onClick={() => {
                deleteMut.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {editing !== null && (
        <Modal open onClose={() => setEditing(null)}>
          <h2 className="text-h2 font-semibold text-primary mb-4">
            {editing === 'new'
              ? 'New profile'
              : `Edit ${typeof editing === 'object' ? editing.name : ''}`}
          </h2>
          <ProfileForm
            initial={editing === 'new' || !editing ? defaultForm() : initialForEdit(editing)}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
