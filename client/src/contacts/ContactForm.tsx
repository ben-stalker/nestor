import { useState, useEffect } from 'react';
import { Modal, Button } from '../shared/ui';
import { useCreateContact, useUpdateContact } from './hooks/useContacts';
import type { Contact, ContactCategory } from './types';
import { CONTACT_CATEGORIES, CATEGORY_LABELS } from './types';

interface ContactFormProps {
  open: boolean;
  contact: Contact | null;
  defaultCategory?: ContactCategory;
  onClose: () => void;
  onCreated?: (contact: Contact) => void;
}

export default function ContactForm({
  open,
  contact,
  defaultCategory,
  onClose,
  onCreated,
}: ContactFormProps) {
  const createMut = useCreateContact();
  const updateMut = useUpdateContact();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<ContactCategory>(defaultCategory ?? 'other');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRole(contact.role ?? '');
      setPhone(contact.phone ?? '');
      setEmail(contact.email ?? '');
      setAddress(contact.address ?? '');
      setCategory(contact.category);
      setNotes(contact.notes ?? '');
    } else {
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCategory(defaultCategory ?? 'other');
      setNotes('');
    }
  }, [contact, defaultCategory, open]);

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      role: role.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      category,
      notes: notes.trim() || null,
    };
    if (contact) {
      updateMut.mutate({ id: contact.id, input: payload }, { onSuccess: () => onClose() });
    } else {
      createMut.mutate(payload, {
        onSuccess: (created) => {
          onCreated?.(created);
          onClose();
        },
      });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Role / Title</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. GP, Plumber, Vet"
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-secondary mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {contact ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
