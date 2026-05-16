import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Pet, PetInput } from './types';
import usePets from './hooks/usePets';
import { createPet } from './api';
import PetList from './PetList';
import PetDetail from './PetDetail';
import PetFormModal from './PetFormModal';
import useFiltersStore from '../store/filtersStore';

export default function PetsPage() {
  const qc = useQueryClient();
  const { data: pets = [], isLoading } = usePets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Register pets as a filter plugin for the calendar
  const registerPlugin = useFiltersStore((s) => s.registerPlugin);
  const unregisterPlugin = useFiltersStore((s) => s.unregisterPlugin);

  useEffect(() => {
    if (pets.length > 0) {
      registerPlugin({
        id: 'pets',
        label: 'Pets',
        items: pets.map((p) => ({ id: String(p.id), label: p.name })),
      });
    }
    return () => {
      unregisterPlugin('pets');
    };
  }, [pets, registerPlugin, unregisterPlugin]);

  // Keep selected pet in sync with updates
  const selectedPetId = selectedPet?.id;
  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      const updated = pets.find((p) => p.id === selectedPetId);
      if (updated) setSelectedPet(updated);
    }
  }, [pets, selectedPetId]);

  const createMutation = useMutation({
    mutationFn: (data: PetInput) => createPet(data),
    onSuccess: (pet) => {
      void qc.invalidateQueries({ queryKey: ['pets'] });
      setShowAddForm(false);
      setSelectedPet(pet);
    },
  });

  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-full">
        <p className="text-secondary text-body">Loading pets…</p>
      </main>
    );
  }

  return (
    <main className="flex h-full" data-testid="pets-page">
      {/* Left column: pet list (landscape sidebar / portrait full width) */}
      <div
        className={`${
          selectedPet
            ? 'hidden landscape:flex landscape:w-72 landscape:shrink-0'
            : 'flex flex-1'
        } flex-col border-r border-surface-elev`}
      >
        <PetList
          pets={pets}
          selectedId={selectedPet?.id ?? null}
          onSelect={setSelectedPet}
          onAdd={() => setShowAddForm(true)}
        />
      </div>

      {/* Right column: pet detail */}
      {selectedPet ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Back button on portrait */}
          <div className="landscape:hidden px-4 py-2 border-b border-surface-elev">
            <button
              type="button"
              onClick={() => setSelectedPet(null)}
              className="text-accent text-caption font-medium"
            >
              ← Back to list
            </button>
          </div>
          <PetDetail
            pet={selectedPet}
            onDeleted={() => setSelectedPet(null)}
          />
        </div>
      ) : (
        <div className="hidden landscape:flex flex-1 items-center justify-center text-secondary text-body">
          Select a pet to view details
        </div>
      )}

      <PetFormModal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={(data) => createMutation.mutate(data)}
        isSaving={createMutation.isPending}
      />
    </main>
  );
}
