import { useState } from 'react';
import { useContacts } from './hooks/useContacts';
import ContactForm from './ContactForm';
import type { Contact, ContactCategory } from './types';

interface ContactPickerProps {
  category: ContactCategory;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
}

export default function ContactPicker({ category, value, onChange, label }: ContactPickerProps) {
  const { data: contacts = [] } = useContacts(category);
  const [addOpen, setAddOpen] = useState(false);

  function handleCreated(contact: Contact) {
    onChange(contact.id);
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="flex-1 rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
        aria-label={label ?? 'Select contact'}
      >
        <option value="">— None —</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.role ? ` (${c.role})` : ''}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="shrink-0 rounded-button border border-surface-elev bg-surface px-3 py-2 text-caption text-secondary hover:bg-surface-elev"
        aria-label="Add new contact"
      >
        + New
      </button>

      <ContactForm
        open={addOpen}
        contact={null}
        defaultCategory={category}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
