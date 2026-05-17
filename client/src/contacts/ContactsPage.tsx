import { useActiveProfile } from '../core/hooks/useActiveProfile';
import ContactsList from './ContactsList';

export default function ContactsPage() {
  const profile = useActiveProfile();
  const isAdmin = profile?.type === 'admin';
  const isChild = profile?.type === 'child' || profile?.type === 'toddler';

  return (
    <main className="flex flex-col h-full overflow-hidden" data-testid="contacts-page">
      <div className="px-4 py-3 border-b border-surface-elev">
        <h1 className="text-h2 font-bold text-primary">Contacts</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <ContactsList isAdmin={isAdmin} isChild={isChild} />
      </div>
    </main>
  );
}
