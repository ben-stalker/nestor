import { useState } from 'react';
import { LogOut, Calendar, Users, Phone, UtensilsCrossed } from 'lucide-react';
import useAppStore from '../store/appStore';
import { useProfiles } from './hooks/useProfiles';
import { verifyAdminPin } from '../api/admin';
import Avatar from '../shared/ui/Avatar';
import AdminPinPrompt from '../shared/ui/AdminPinPrompt';
import EmptyState from '../shared/ui/EmptyState';
import Card from '../shared/ui/Card';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function GuestOverlay() {
  const guestProfileId = useAppStore((s) => s.guestProfileId);
  const setGuestMode = useAppStore((s) => s.setGuestMode);
  const { data: profiles } = useProfiles();
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const guestProfile = profiles?.find((p) => String(p.id) === guestProfileId);

  if (!guestProfileId || !guestProfile) return null;

  return (
    <>
      <div className="guest-overlay" role="main" aria-label="Guest mode">
        <header className="guest-overlay__header">
          <Avatar name={guestProfile.name} colour={guestProfile.colour} size="lg" />
          <div className="guest-overlay__header-text">
            <h1 className="text-h2 font-bold text-primary">{guestProfile.name}</h1>
            <p className="text-caption text-secondary">{todayLabel()}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExitPrompt(true)}
            className="guest-overlay__exit-btn"
            aria-label="Exit guest mode"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Exit</span>
          </button>
        </header>

        <div className="guest-overlay__grid">
          <section aria-labelledby="guest-events-heading">
            <h2 id="guest-events-heading" className="guest-section-title">
              <Calendar size={16} aria-hidden="true" />
              Today's Events
            </h2>
            <Card>
              <EmptyState heading="Nothing scheduled" />
            </Card>
          </section>

          <section aria-labelledby="guest-routines-heading">
            <h2 id="guest-routines-heading" className="guest-section-title">
              <Users size={16} aria-hidden="true" />
              Child Routines
            </h2>
            <Card>
              <EmptyState heading="No routines set up" />
            </Card>
          </section>

          <section aria-labelledby="guest-contacts-heading">
            <h2 id="guest-contacts-heading" className="guest-section-title">
              <Phone size={16} aria-hidden="true" />
              Emergency Contacts
            </h2>
            <Card>
              <EmptyState heading="None added yet" />
            </Card>
          </section>

          <section aria-labelledby="guest-meal-heading">
            <h2 id="guest-meal-heading" className="guest-section-title">
              <UtensilsCrossed size={16} aria-hidden="true" />
              Today's Meal
            </h2>
            <Card>
              <EmptyState heading="No meal planned" />
            </Card>
          </section>
        </div>
      </div>

      {showExitPrompt && (
        <AdminPinPrompt
          title="Admin PIN to exit guest mode"
          onVerify={verifyAdminPin}
          onSuccess={() => {
            setShowExitPrompt(false);
            setGuestMode(null);
          }}
          onClose={() => setShowExitPrompt(false)}
        />
      )}
    </>
  );
}
