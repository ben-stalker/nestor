import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useReducedMotion from '../hooks/useReducedMotion';
import { completeChore } from '../family/api';
import type { Chore } from '../family/types';

interface Props {
  chore: Chore;
  profileId: number;
  completedToday?: boolean;
}

function BurstAnimation({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="chore-tile__burst"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={onDone}
      aria-hidden="true"
    />
  );
}

export default function ChoreTile({ chore, profileId, completedToday = false }: Props) {
  const prefersReduced = useReducedMotion();
  const [showBurst, setShowBurst] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => completeChore(chore.id),
    onSuccess: () => {
      if (!prefersReduced) setShowBurst(true);
      void queryClient.invalidateQueries({ queryKey: ['chores', profileId] });
      void queryClient.invalidateQueries({ queryKey: ['rewards', 'grid', profileId] });
    },
  });

  const done = completedToday || mutation.isSuccess;

  return (
    <div className={`chore-tile${done ? ' chore-tile--done' : ''}`}>
      <div className="chore-tile__info">
        <span className="chore-tile__name">{chore.name}</span>
        <span className="chore-tile__points">{chore.points} pts</span>
      </div>

      <button
        type="button"
        className="chore-tile__check"
        disabled={done || mutation.isPending}
        aria-label={done ? `${chore.name} done` : `Complete ${chore.name}`}
        aria-pressed={done}
        onClick={() => mutation.mutate()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="28" height="28">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={done ? 2.5 : 1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {showBurst && <BurstAnimation onDone={() => setShowBurst(false)} />}
      </AnimatePresence>
    </div>
  );
}
