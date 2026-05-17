import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Contact } from '../../src/contacts/types';

const mockContact: Contact = {
  id: 1,
  name: 'Dr. Smith',
  role: 'GP',
  phone: '01234567890',
  email: 'smith@nhs.uk',
  address: '1 High St',
  category: 'medical',
  notes: null,
  linked_pet_id: null,
  linked_vehicle_id: null,
  created_at: 1000,
};

const ContactCard = (await import('../../src/contacts/ContactCard')).default;

describe('ContactCard', () => {
  it('renders contact name and role', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('GP')).toBeInTheDocument();
  });

  it('renders tel: link for phone number', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /call/i });
    expect(link).toHaveAttribute('href', 'tel:01234567890');
  });

  it('renders mailto: link for email', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /email/i });
    expect(link).toHaveAttribute('href', 'mailto:smith@nhs.uk');
  });

  it('shows edit/delete buttons for admin', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('hides edit/delete buttons for non-admin', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('renders initials avatar', () => {
    render(
      <ContactCard
        contact={{ ...mockContact, name: 'Jane Doe' }}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders address', () => {
    render(
      <ContactCard
        contact={mockContact}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('1 High St')).toBeInTheDocument();
  });

  it('renders contact without phone', () => {
    render(
      <ContactCard
        contact={{ ...mockContact, phone: null }}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('link', { name: /call/i })).not.toBeInTheDocument();
  });
});
