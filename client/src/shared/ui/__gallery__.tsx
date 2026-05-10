import React, { useState } from 'react';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import EmptyState from './EmptyState';
import IconButton from './IconButton';
import Modal from './Modal';
import Pill from './Pill';
import Skeleton from './Skeleton';
import TouchTarget from './TouchTarget';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b border-surface-elev pb-2 text-h1 font-semibold text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UIGallery() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm p-8 font-sans">
      <h1 className="mb-2 text-display font-bold text-primary">UI Gallery</h1>
      <p className="mb-10 text-body text-secondary">Design-system primitives — STORY-2.5</p>

      {/* ── Card ── */}
      <Section title="Card">
        <div className="flex flex-wrap gap-4">
          <Card padding="sm">
            <p className="text-body text-primary">Small padding</p>
          </Card>
          <Card padding="md">
            <p className="text-body text-primary">Medium padding</p>
          </Card>
          <Card padding="lg" shadow>
            <p className="text-body text-primary">Large + shadow</p>
          </Card>
        </div>
      </Section>

      {/* ── Button ── */}
      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      {/* ── TouchTarget ── */}
      <Section title="TouchTarget">
        <div className="flex flex-wrap gap-4">
          <TouchTarget className="rounded-button bg-surface-elev text-caption text-primary">
            Default (button)
          </TouchTarget>
          <TouchTarget
            as="a"
            href="#"
            className="rounded-button bg-surface-elev text-caption text-primary"
          >
            As anchor
          </TouchTarget>
        </div>
      </Section>

      {/* ── Modal ── */}
      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
          <p className="mb-4 text-body text-secondary">
            Full-screen on portrait, dialog on landscape. Press Escape or click outside to close.
          </p>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </Modal>
      </Section>

      {/* ── Pill ── */}
      <Section title="Pill">
        <div className="flex flex-wrap gap-2">
          <Pill>Default</Pill>
          <Pill colour="#e8621a">Food</Pill>
          <Pill colour="#ef4444">Urgent</Pill>
          <Pill colour="#22c55e" icon="✓">
            Done
          </Pill>
          <Pill colour="#3b82f6">Info</Pill>
        </div>
      </Section>

      {/* ── Avatar ── */}
      <Section title="Avatar">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Alice Smith" size="sm" colour="var(--color-profile-1)" />
          <Avatar name="Bob Jones" size="md" colour="var(--color-profile-2)" />
          <Avatar name="Charlie" size="lg" colour="var(--color-profile-3)" />
          <Avatar name="Diana Prince" src="https://i.pravatar.cc/64" size="md" />
        </div>
      </Section>

      {/* ── IconButton ── */}
      <Section title="IconButton">
        <div className="flex gap-3">
          <IconButton label="Add" icon={<span aria-hidden="true">＋</span>} />
          <IconButton label="Close" icon={<span aria-hidden="true">✕</span>} />
          <IconButton label="Menu" icon={<span aria-hidden="true">☰</span>} />
        </div>
      </Section>

      {/* ── Skeleton ── */}
      <Section title="Skeleton">
        <div className="flex max-w-sm flex-col gap-4">
          <Skeleton />
          <Skeleton lines={3} />
          <Card>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-surface-elev motion-reduce:animate-none" />
              <Skeleton className="flex-1" />
            </div>
            <Skeleton lines={2} />
          </Card>
        </div>
      </Section>

      {/* ── EmptyState ── */}
      <Section title="EmptyState">
        <EmptyState
          icon="📭"
          heading="Nothing here yet"
          body="Add your first item to get started."
          cta={<Button size="sm">Add item</Button>}
        />
      </Section>

      {/* ── Colour palette ── */}
      <Section title="Colour tokens">
        <div className="flex flex-wrap gap-3">
          {[
            ['warm', 'bg-warm border border-surface-elev'],
            ['surface', 'bg-surface border border-surface-elev'],
            ['surface-elev', 'bg-surface-elev'],
            ['mode-home', 'bg-mode-home'],
            ['mode-food', 'bg-mode-food'],
            ['mode-family', 'bg-mode-family'],
            ['mode-finance', 'bg-mode-finance'],
            ['alert-urgent', 'bg-alert-urgent'],
            ['alert-warning', 'bg-alert-warning'],
            ['alert-info', 'bg-alert-info'],
            ['alert-success', 'bg-alert-success'],
          ].map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className={`h-10 w-16 rounded-lg ${cls}`} />
              <span className="text-caption text-muted">{name}</span>
            </div>
          ))}
        </div>
        <h4 className="mb-2 mt-4 text-caption font-semibold uppercase tracking-wide text-secondary">
          Profile colours
        </h4>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: `var(--color-profile-${i + 1})` }}
              title={`profile-${i + 1}`}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
