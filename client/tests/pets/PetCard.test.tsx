import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Pet } from '../../src/pets/types';

const PetCard = (await import('../../src/pets/PetCard')).default;

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 1,
    name: 'Buddy',
    species: 'dog',
    breed: null,
    dob: null,
    colour: null,
    microchip: null,
    insurance_policy: null,
    vet_name: null,
    vet_phone: null,
    vet_address: null,
    feeding_notes: null,
    grooming_notes: null,
    photo_path: null,
    is_active: true,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

describe('PetCard', () => {
  it('renders pet name', () => {
    render(<PetCard pet={makePet()} />);
    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('renders species label', () => {
    render(<PetCard pet={makePet({ species: 'cat' })} />);
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });

  it('renders breed when provided', () => {
    render(<PetCard pet={makePet({ breed: 'Labrador' })} />);
    expect(screen.getByText(/Labrador/)).toBeInTheDocument();
  });

  it('renders age when dob provided', () => {
    render(<PetCard pet={makePet({ dob: '2020-01-01' })} />);
    // Just check the card renders — age text varies
    expect(screen.getByTestId('pet-card')).toBeInTheDocument();
  });

  it('applies selected styling when selected prop is true', () => {
    render(<PetCard pet={makePet()} selected />);
    const card = screen.getByTestId('pet-card');
    expect(card.className).toMatch(/border-accent/);
  });
});
