import { useRef } from 'react';
import { Phone, Mail, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Contact } from './types';
import { CATEGORY_COLOURS } from './types';
import { IconButton } from '../shared/ui';

interface ContactCardProps {
  contact: Contact;
  isAdmin: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

function initials(name: string): string {
  const parts = name
    .trim()
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s*/i, '')
    .split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return ((first + last).toUpperCase() || name[0]?.toUpperCase()) ?? '?';
}

export default function ContactCard({ contact, isAdmin, onEdit, onDelete }: ContactCardProps) {
  const colour = CATEGORY_COLOURS[contact.category];
  const abbr = initials(contact.name);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePhonePointerDown(phone: string) {
    longPressTimer.current = setTimeout(() => {
      void navigator.clipboard.writeText(phone).catch(() => undefined);
    }, 600);
  }

  function handlePhonePointerUp() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-card bg-surface-elev"
      data-testid="contact-card"
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-caption font-bold"
        style={{ backgroundColor: colour }}
        aria-hidden="true"
      >
        {abbr}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-primary truncate">{contact.name}</p>
        {contact.role && <p className="text-caption text-secondary truncate">{contact.role}</p>}
        <div className="mt-1 space-y-0.5">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1.5 text-caption text-accent hover:underline"
              aria-label={`Call ${contact.name}`}
              title="Tap to call · Hold to copy number"
              onPointerDown={() => handlePhonePointerDown(contact.phone!)}
              onPointerUp={handlePhonePointerUp}
              onPointerLeave={handlePhonePointerUp}
            >
              <Phone size={12} />
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1.5 text-caption text-secondary hover:underline truncate"
              aria-label={`Email ${contact.name}`}
            >
              <Mail size={12} />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.address && (
            <p className="flex items-start gap-1.5 text-caption text-secondary">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              <span className="truncate">{contact.address}</span>
            </p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-1 flex-shrink-0">
          <IconButton
            icon={<Pencil size={16} />}
            label={`Edit ${contact.name}`}
            onClick={() => onEdit(contact)}
          />
          <IconButton
            icon={<Trash2 size={16} />}
            label={`Delete ${contact.name}`}
            onClick={() => onDelete(contact)}
          />
        </div>
      )}
    </div>
  );
}
