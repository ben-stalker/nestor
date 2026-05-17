import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../shared/ui';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import { useContacts, useDeleteContact } from './hooks/useContacts';
import type { Contact, ContactCategory } from './types';
import { CONTACT_CATEGORIES, CATEGORY_LABELS } from './types';

interface ContactsListProps {
  isAdmin: boolean;
  isChild: boolean;
}

export default function ContactsList({ isAdmin, isChild }: ContactsListProps) {
  const { data: contacts = [], isLoading } = useContacts();
  const deleteMut = useDeleteContact();

  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<ContactCategory>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const visibleCategories: ContactCategory[] = isChild ? ['emergency'] : [...CONTACT_CATEGORIES];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        visibleCategories.includes(c.category) &&
        (q === '' || c.name.toLowerCase().includes(q) || (c.role ?? '').toLowerCase().includes(q)),
    );
  }, [contacts, search, isChild]);

  const byCategory = useMemo(
    () =>
      visibleCategories.reduce<Record<ContactCategory, Contact[]>>(
        (acc, cat) => {
          acc[cat] = filtered.filter((c) => c.category === cat);
          return acc;
        },
        {} as Record<ContactCategory, Contact[]>,
      ),
    [filtered, visibleCategories],
  );

  function toggleCollapse(cat: ContactCategory) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleEdit(contact: Contact) {
    setEditing(contact);
    setFormOpen(true);
  }

  function handleDelete(contact: Contact) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete ${contact.name}?`)) return;
    deleteMut.mutate(contact.id);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-secondary text-body">Loading contacts…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="contacts-list">
      <div className="p-4 border-b border-surface-elev flex gap-2 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role…"
          className="flex-1 rounded-button border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          aria-label="Search contacts"
        />
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)} size="sm">
            <Plus size={16} />
            Add
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleCategories.map((cat) => {
          const items = byCategory[cat] ?? [];
          const isCollapsed = collapsed.has(cat);
          return (
            <section key={cat} aria-label={CATEGORY_LABELS[cat]}>
              <button
                type="button"
                onClick={() => toggleCollapse(cat)}
                className="w-full flex items-center justify-between py-1 text-left"
                aria-expanded={!isCollapsed}
              >
                <span className="text-caption font-semibold text-secondary uppercase tracking-wide">
                  {CATEGORY_LABELS[cat]} ({items.length})
                </span>
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-secondary" />
                ) : (
                  <ChevronDown size={16} className="text-secondary" />
                )}
              </button>

              {!isCollapsed && (
                <div className="mt-2 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-caption text-secondary italic pl-1">
                      No {CATEGORY_LABELS[cat].toLowerCase()} contacts
                    </p>
                  ) : (
                    items.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {isAdmin && <ContactForm open={formOpen} contact={editing} onClose={handleFormClose} />}
    </div>
  );
}
