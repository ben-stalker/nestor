import { PawPrint } from 'lucide-react';
import type { Pet } from './types';
import { PET_SPECIES_LABELS } from './types';

interface PetCardProps {
  pet: Pet;
  selected?: boolean;
  onClick?: () => void;
}

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  const ageMs = now.getTime() - birth.getTime();
  const years = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor(
    (ageMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44),
  );
  if (years > 0) return `${years}y ${months}m`;
  return `${months}m`;
}

export default function PetCard({ pet, selected, onClick }: PetCardProps) {
  const age = calcAge(pet.dob);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-card p-3 transition-colors border-2 ${
        selected
          ? 'border-accent bg-surface-elev'
          : 'border-transparent bg-surface hover:bg-surface-elev'
      }`}
      data-testid="pet-card"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="shrink-0 w-14 h-14 rounded-full bg-surface-elev overflow-hidden flex items-center justify-center">
          {pet.photo_path ? (
            <img
              src={`/api/v1/pets/${pet.id}/photo`}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <PawPrint size={28} className="text-secondary" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-primary truncate">{pet.name}</p>
          <p className="text-caption text-secondary">{PET_SPECIES_LABELS[pet.species]}</p>
          {(age || pet.breed) && (
            <p className="text-caption text-secondary truncate">
              {[pet.breed, age].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
