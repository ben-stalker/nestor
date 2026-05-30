import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
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

// ─── Particle burst on star tap ───────────────────────────────────────────────
const PARTICLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
const GOLD = '#f5a623';

function StarParticleBurst({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {PARTICLE_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 36;
        const y = Math.sin(rad) * 36;
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: GOLD,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x,
              y,
              opacity: 0,
              scale: 0.5,
              transition: {
                duration: 0.4,
                delay: i * 0.01,
                ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
              },
            }}
            onAnimationComplete={i === 0 ? onDone : undefined}
          />
        );
      })}
    </div>
  );
}

// ─── Confetti shower for goal reached ────────────────────────────────────────
const CONFETTI_COLORS = ['#f5a623', '#3F7CAC', '#5B8C6E', '#D86B4A', '#7E5BA6', '#C75B86'];

function ConfettiShower({ onDone }: { onDone: () => void }) {
  const pieces = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 0.8 + Math.random() * 0.4;
        const rotation = Math.random() * 720 - 360;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 6;

        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: '-10px',
              width: size,
              height: size * 0.5,
              background: color,
              borderRadius: 2,
            }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: '110vh',
              rotate: rotation,
              opacity: [1, 1, 0],
              transition: { duration, delay, ease: 'linear' },
            }}
            onAnimationComplete={i === 0 ? onDone : undefined}
          />
        );
      })}
    </div>
  );
}

function RewardBurst({ onDone }: { onDone: () => void }) {
  const prefersReduced = useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(!prefersReduced);

  useEffect(() => {
    const t = setTimeout(onDone, prefersReduced ? 0 : 1500);
    return () => clearTimeout(t);
  }, [onDone, prefersReduced]);

  if (prefersReduced) {
    return (
      <div className="reward-burst" aria-live="assertive" aria-label="Reward target reached!">
        <Check className="size-8 text-alert-success" />
      </div>
    );
  }

  return (
    <>
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
      <AnimatePresence>
        {showConfetti && <ConfettiShower onDone={() => setShowConfetti(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Clickable star with particle burst ──────────────────────────────────────
function AnimatedStar({ filled, onTap }: { filled: boolean; onTap?: () => void }) {
  const [burst, setBurst] = useState(false);
  const rm = useReducedMotion();

  function handleClick() {
    if (!filled || rm) {
      onTap?.();
      return;
    }
    setBurst(true);
    onTap?.();
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={filled ? 'Star earned' : 'Star not yet earned'}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: filled ? 'pointer' : 'default',
        }}
        whileTap={rm || !filled ? undefined : { scale: 1.2 }}
      >
        <StarIcon filled={filled} />
      </motion.button>
      <AnimatePresence>
        {burst && <StarParticleBurst onDone={() => setBurst(false)} />}
      </AnimatePresence>
    </div>
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
          <AnimatedStar key={i} filled={i < data.filled} />
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
