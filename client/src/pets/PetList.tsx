import { PlusCircle } from 'lucide-react';
import type { Pet } from './types';
import PetCard from './PetCard';
import { EmptyState } from '../shared/ui';

interface PetListProps {
  pets: Pet[];
  selectedId: number | null;
  onSelect: (pet: Pet) => void;
  onAdd: () => void;
}

export default function PetList({ pets, selectedId, onSelect, onAdd }: PetListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-elev">
        <h2 className="text-h2 font-semibold text-primary">Pets</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 text-accent text-caption font-medium hover:opacity-80 transition-opacity"
          aria-label="Add pet"
        >
          <PlusCircle size={18} />
          Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pets.length === 0 ? (
          <EmptyState heading="No pets yet" body="Add your first pet to get started." />
        ) : (
          pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              selected={selectedId === pet.id}
              onClick={() => onSelect(pet)}
            />
          ))
        )}
      </div>
    </div>
  );
}
