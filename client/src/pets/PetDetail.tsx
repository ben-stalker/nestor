import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PawPrint, Edit2, Trash2, Plus, Phone, MapPin, Stethoscope } from 'lucide-react';
import type { Pet, PetHealthLog, PetHealthLogInput } from './types';
import { PET_SPECIES_LABELS } from './types';
import usePetHealthLogs from './hooks/usePetHealthLogs';
import { createHealthLog, updateHealthLog, deleteHealthLog, deletePet, updatePet } from './api';
import { Button } from '../shared/ui';
import HealthLogList from './health/HealthLogList';
import HealthLogFormModal from './health/HealthLogFormModal';
import WeightChart from './health/WeightChart';
import DocumentList from './DocumentList';
import PetFormModal from './PetFormModal';

type PetTab = 'overview' | 'health' | 'documents';

interface PetDetailProps {
  pet: Pet;
  onDeleted: () => void;
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
  if (years > 0) return `${years} yrs ${months} months`;
  return `${months} months`;
}

export default function PetDetail({ pet, onDeleted }: PetDetailProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<PetTab>('overview');
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [editLog, setEditLog] = useState<PetHealthLog | null>(null);
  const [showEditPet, setShowEditPet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: logs = [], isLoading: logsLoading } = usePetHealthLogs(pet.id);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['pet-health-logs', pet.id] });
    void qc.invalidateQueries({ queryKey: ['pets-upcoming-care'] });
  };

  const createLogMutation = useMutation({
    mutationFn: (data: PetHealthLogInput) => createHealthLog(pet.id, data),
    onSuccess: () => {
      invalidate();
      setShowHealthForm(false);
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ logId, data }: { logId: number; data: Partial<PetHealthLogInput> }) =>
      updateHealthLog(pet.id, logId, data),
    onSuccess: () => {
      invalidate();
      setEditLog(null);
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId: number) => deleteHealthLog(pet.id, logId),
    onSuccess: () => invalidate(),
  });

  const updatePetMutation = useMutation({
    mutationFn: (data: Partial<Pet>) => updatePet(pet.id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pets'] });
      setShowEditPet(false);
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: () => deletePet(pet.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pets'] });
      onDeleted();
    },
  });

  const weightLogs = logs.filter((l) => l.log_type === 'weight' && l.weight_kg != null);

  const TABS: Array<{ id: PetTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'health', label: 'Health Log' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="flex flex-col h-full" data-testid="pet-detail">
      {/* Header */}
      <div className="flex items-start gap-4 p-4 border-b border-surface-elev">
        <div className="shrink-0 w-16 h-16 rounded-full bg-surface-elev overflow-hidden flex items-center justify-center">
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
        <div className="flex-1 min-w-0">
          <h2 className="text-h2 font-bold text-primary">{pet.name}</h2>
          <p className="text-body text-secondary">{PET_SPECIES_LABELS[pet.species]}</p>
          {pet.breed && <p className="text-caption text-secondary">{pet.breed}</p>}
          {pet.dob && (
            <p className="text-caption text-secondary">
              {calcAge(pet.dob)} old · Born {pet.dob}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowEditPet(true)}>
            <Edit2 size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <p className="text-body text-red-700 flex-1">Remove {pet.name}?</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deletePetMutation.mutate()}
            disabled={deletePetMutation.isPending}
          >
            Remove
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex border-b border-surface-elev overflow-x-auto"
        role="tablist"
        aria-label="Pet sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-2.5 text-body font-medium transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Weight chart */}
            {weightLogs.length > 0 && <WeightChart logs={logs} />}

            {/* Vet info */}
            {(pet.vet_name || pet.vet_phone || pet.vet_address) && (
              <div className="bg-surface-elev rounded-card p-4 space-y-2">
                <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-1">
                  Vet
                </p>
                {pet.vet_name && (
                  <div className="flex items-start gap-2">
                    <Stethoscope size={14} className="text-secondary mt-0.5 shrink-0" />
                    <p className="text-body text-primary">{pet.vet_name}</p>
                  </div>
                )}
                {pet.vet_phone && (
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-secondary mt-0.5 shrink-0" />
                    <a href={`tel:${pet.vet_phone}`} className="text-body text-accent hover:underline">
                      {pet.vet_phone}
                    </a>
                  </div>
                )}
                {pet.vet_address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-secondary mt-0.5 shrink-0" />
                    <p className="text-body text-primary">{pet.vet_address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Feeding notes */}
            {pet.feeding_notes && (
              <div className="bg-surface-elev rounded-card p-4">
                <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-1">
                  Feeding
                </p>
                <p className="text-body text-primary whitespace-pre-wrap">{pet.feeding_notes}</p>
              </div>
            )}

            {/* Grooming notes */}
            {pet.grooming_notes && (
              <div className="bg-surface-elev rounded-card p-4">
                <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-1">
                  Grooming
                </p>
                <p className="text-body text-primary whitespace-pre-wrap">{pet.grooming_notes}</p>
              </div>
            )}

            {/* Other details */}
            <div className="bg-surface-elev rounded-card p-4 space-y-1">
              <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-1">
                Details
              </p>
              {pet.colour && (
                <p className="text-body text-primary">
                  <span className="text-secondary">Colour: </span>
                  {pet.colour}
                </p>
              )}
              {pet.microchip && (
                <p className="text-body text-primary">
                  <span className="text-secondary">Microchip: </span>
                  {pet.microchip}
                </p>
              )}
              {pet.insurance_policy && (
                <p className="text-body text-primary">
                  <span className="text-secondary">Insurance: </span>
                  {pet.insurance_policy}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'health' && (
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-elev">
              <h3 className="text-body font-semibold text-primary">Health Log</h3>
              <Button size="sm" onClick={() => setShowHealthForm(true)}>
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
            {logsLoading ? (
              <p className="text-secondary text-body p-4">Loading…</p>
            ) : (
              <HealthLogList
                logs={logs.filter((l) => l.log_type !== 'document')}
                petId={pet.id}
                onDelete={(logId) => deleteLogMutation.mutate(logId)}
                onEdit={(log) => setEditLog(log)}
              />
            )}
          </div>
        )}

        {tab === 'documents' && (
          <DocumentList petId={pet.id} logs={logs} />
        )}
      </div>

      {/* Add health log modal */}
      <HealthLogFormModal
        open={showHealthForm}
        petId={pet.id}
        onClose={() => setShowHealthForm(false)}
        onSave={(data) => createLogMutation.mutate(data)}
        isSaving={createLogMutation.isPending}
      />

      {/* Edit health log modal */}
      {editLog && (
        <HealthLogFormModal
          open={true}
          petId={pet.id}
          log={editLog}
          onClose={() => setEditLog(null)}
          onSave={(data) => updateLogMutation.mutate({ logId: editLog.id, data })}
          isSaving={updateLogMutation.isPending}
        />
      )}

      {/* Edit pet modal */}
      <PetFormModal
        open={showEditPet}
        pet={pet}
        onClose={() => setShowEditPet(false)}
        onSave={(data) => updatePetMutation.mutate(data)}
        isSaving={updatePetMutation.isPending}
      />
    </div>
  );
}
