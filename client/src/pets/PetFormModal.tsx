import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, Button } from '../shared/ui';
import type { Pet, PetInput, PetSpecies } from './types';
import { PET_SPECIES, PET_SPECIES_LABELS } from './types';
import { uploadPetPhoto } from './api';
import ContactPicker from '../contacts/ContactPicker';

interface PetFormModalProps {
  open: boolean;
  pet?: Pet | null;
  onClose: () => void;
  onSave: (data: PetInput) => void;
  isSaving?: boolean;
}

export default function PetFormModal({ open, pet, onClose, onSave, isSaving }: PetFormModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(pet?.species ?? 'dog');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [dob, setDob] = useState(pet?.dob ?? '');
  const [colour, setColour] = useState(pet?.colour ?? '');
  const [microchip, setMicrochip] = useState(pet?.microchip ?? '');
  const [insurance, setInsurance] = useState(pet?.insurance_policy ?? '');
  const [vetName, setVetName] = useState(pet?.vet_name ?? '');
  const [vetPhone, setVetPhone] = useState(pet?.vet_phone ?? '');
  const [vetAddress, setVetAddress] = useState(pet?.vet_address ?? '');
  const [vetContactId, setVetContactId] = useState<number | null>(pet?.vet_contact_id ?? null);
  const [feedingNotes, setFeedingNotes] = useState(pet?.feeding_notes ?? '');
  const [groomingNotes, setGroomingNotes] = useState(pet?.grooming_notes ?? '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      species,
      breed: breed || null,
      dob: dob || null,
      colour: colour || null,
      microchip: microchip || null,
      insurance_policy: insurance || null,
      vet_name: vetName || null,
      vet_phone: vetPhone || null,
      vet_address: vetAddress || null,
      vet_contact_id: vetContactId,
      feeding_notes: feedingNotes || null,
      grooming_notes: groomingNotes || null,
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pet) return;
    setPhotoUploading(true);
    try {
      await uploadPetPhoto(pet.id, file);
      await qc.invalidateQueries({ queryKey: ['pets'] });
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={pet ? 'Edit Pet' : 'Add Pet'}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {pet && (
          <div>
            <label className="block text-caption text-secondary mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={(e) => {
                handlePhotoChange(e).catch(() => {});
              }}
              className="text-body text-primary"
            />
            {photoUploading && <p className="text-caption text-secondary mt-1">Uploading…</p>}
          </div>
        )}

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-name">
            Name *
          </label>
          <input
            id="pet-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-species">
            Species
          </label>
          <select
            id="pet-species"
            value={species}
            onChange={(e) => setSpecies(e.target.value as PetSpecies)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          >
            {PET_SPECIES.map((s) => (
              <option key={s} value={s}>
                {PET_SPECIES_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-breed">
            Breed
          </label>
          <input
            id="pet-breed"
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-dob">
            Date of birth
          </label>
          <input
            id="pet-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-colour">
            Colour / markings
          </label>
          <input
            id="pet-colour"
            type="text"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-microchip">
            Microchip number
          </label>
          <input
            id="pet-microchip"
            type="text"
            value={microchip}
            onChange={(e) => setMicrochip(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div>
          <label className="block text-caption text-secondary mb-1" htmlFor="pet-insurance">
            Insurance policy
          </label>
          <input
            id="pet-insurance"
            type="text"
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
            className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
          />
        </div>

        <div className="border-t border-surface-elev pt-3">
          <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-2">
            Vet Information
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-caption text-secondary mb-1">
                Vet contact (from Contacts)
              </label>
              <ContactPicker
                category="pets"
                value={vetContactId}
                onChange={setVetContactId}
                label="Select vet contact"
              />
            </div>
            <div>
              <label className="block text-caption text-secondary mb-1" htmlFor="vet-name">
                Vet / practice name
              </label>
              <input
                id="vet-name"
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
              />
            </div>
            <div>
              <label className="block text-caption text-secondary mb-1" htmlFor="vet-phone">
                Vet phone
              </label>
              <input
                id="vet-phone"
                type="tel"
                value={vetPhone}
                onChange={(e) => setVetPhone(e.target.value)}
                className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
              />
            </div>
            <div>
              <label className="block text-caption text-secondary mb-1" htmlFor="vet-address">
                Vet address
              </label>
              <textarea
                id="vet-address"
                value={vetAddress}
                onChange={(e) => setVetAddress(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-surface-elev pt-3">
          <p className="text-caption font-semibold text-secondary uppercase tracking-wider mb-2">
            Care Notes
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-caption text-secondary mb-1" htmlFor="feeding-notes">
                Feeding notes
              </label>
              <textarea
                id="feeding-notes"
                value={feedingNotes}
                onChange={(e) => setFeedingNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-caption text-secondary mb-1" htmlFor="grooming-notes">
                Grooming notes
              </label>
              <textarea
                id="grooming-notes"
                value={groomingNotes}
                onChange={(e) => setGroomingNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
