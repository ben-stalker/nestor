import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHealthLog } from './api';

interface Props {
  profileId: number;
}

const EMOJIS = ['😢', '😞', '😐', '🙂', '😄'] as const;
const LABELS = ['Very sad', 'Sad', 'Neutral', 'Happy', 'Very happy'] as const;

export default function MoodCheckin({ profileId }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const log = useMutation({
    mutationFn: (score: number) =>
      createHealthLog(profileId, {
        log_type: 'mood',
        score,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mood-trend', profileId] });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="mood-checkin mood-checkin--done">
        <p>Mood logged! {EMOJIS[(selected ?? 3) - 1]}</p>
        <button
          type="button"
          className="mood-checkin__reset"
          onClick={() => {
            setSubmitted(false);
            setSelected(null);
            setNote('');
          }}
        >
          Log again
        </button>
      </div>
    );
  }

  return (
    <div className="mood-checkin">
      <h3 className="mood-checkin__title">How are you feeling today?</h3>
      <div className="mood-checkin__emojis" role="group" aria-label="Mood scale">
        {EMOJIS.map((emoji, i) => {
          const score = i + 1;
          return (
            <button
              key={score}
              type="button"
              aria-label={LABELS[i]}
              aria-pressed={selected === score}
              className={`mood-checkin__emoji${selected === score ? ' mood-checkin__emoji--selected' : ''}`}
              onClick={() => setSelected(score)}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <>
          <textarea
            className="mood-checkin__note"
            placeholder="Optional note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <button
            type="button"
            className="mood-checkin__submit"
            onClick={() => log.mutate(selected)}
            disabled={log.isPending}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
