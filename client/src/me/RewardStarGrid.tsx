import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import useReducedMotion from '../hooks/useReducedMotion';
import { getRewardGrid } from '../family/api';

interface Props {
  profileId: number;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`reward-star${filled ? ' reward-star--filled' : ' reward-star--empty'}`}
      width="32"
      height="32"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
      />
    </svg>
  );
}

function RewardBurst({ onDone }: { onDone: () => void }) {
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, prefersReduced ? 0 : 1500);
    return () => clearTimeout(t);
  }, [onDone, prefersReduced]);

  if (prefersReduced) return null;

  return (
    <motion.div
      className="reward-burst"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{ duration: 0.8 }}
      aria-live="assertive"
      aria-label="Reward target reached!"
    >
      <StarIcon filled />
    </motion.div>
  );
}

export default function RewardStarGrid({ profileId }: Props) {
  const prevFilledRef = useRef<number | null>(null);
  const { data } = useQuery({
    queryKey: ['rewards', 'grid', profileId],
    queryFn: () => getRewardGrid(profileId),
    staleTime: 15_000,
  });

  const targetJustHit =
    data !== undefined &&
    prevFilledRef.current !== null &&
    prevFilledRef.current !== data.filled &&
    data.filled === 0 &&
    data.totalEarned > 0;

  if (data !== undefined) prevFilledRef.current = data.filled;

  if (!data) {
    return (
      <div className="reward-star-grid reward-star-grid--skeleton" aria-label="Loading stars" />
    );
  }

  return (
    <div className="reward-star-grid">
      <div
        className="reward-star-grid__stars"
        aria-label={`${data.filled} of ${data.total} stars filled toward next reward`}
        role="img"
      >
        {Array.from({ length: data.total }).map((_, i) => (
          <StarIcon key={i} filled={i < data.filled} />
        ))}
      </div>

      {data.streak > 0 && (
        <div className="reward-star-grid__streak" aria-label={`${data.streak} day streak`}>
          <span className="reward-star-grid__streak-count">{data.streak}</span>
          <span className="reward-star-grid__streak-label">
            {data.streak === 1 ? 'day streak' : 'day streak'}
          </span>
        </div>
      )}

      {data.moneyEquivalent != null && (
        <div className="reward-star-grid__allowance" aria-label="Points money value">
          <span className="reward-star-grid__points-label">
            {data.totalEarned} pts = <strong>£{data.moneyEquivalent.toFixed(2)}</strong>
          </span>
        </div>
      )}

      <AnimatePresence>
        {targetJustHit && (
          <RewardBurst
            onDone={() => {
              prevFilledRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
