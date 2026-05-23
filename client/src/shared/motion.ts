/**
 * Motion foundation — EPIC-22 STORY-22.1
 *
 * Central animation tokens, easing presets, and shared variants for the
 * Nestor household dashboard.  Always consumed via the helpers below so
 * reduced-motion preferences are automatically honoured.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Duration tokens (seconds) ────────────────────────────────────────────────
export const durations = {
  fast: 0.15,
  default: 0.25,
  slow: 0.4,
} as const;

// ─── Easing presets ───────────────────────────────────────────────────────────
export const easings = {
  /** Framer-motion spring — snappy, physical feel */
  spring: { type: 'spring', damping: 20, stiffness: 300 } as Transition,
  /** CSS-style ease-out cubic bezier */
  easeOut: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  /** CSS-style ease-in cubic bezier */
  easeIn: [0.4, 0.0, 1, 1] as [number, number, number, number],
} as const;

// ─── Fade-only fallback for reduced-motion ────────────────────────────────────
const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/**
 * Returns `variants` unchanged when reducedMotion is false.
 * When reducedMotion is true, returns a simple opacity-only fade (100 ms)
 * regardless of the passed variants.
 */
export function motionSafe(variants: Variants, reducedMotion: boolean): Variants {
  return reducedMotion ? reducedVariants : variants;
}

// ─── Common variants ──────────────────────────────────────────────────────────

/** Slides up from 16 px below, fades in */
export const slideUp: Variants = {
  initial: { y: 16, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: durations.default, ease: easings.easeOut },
  },
  exit: {
    y: 16,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/** Slides in from the right */
export const slideRight: Variants = {
  initial: { x: 30, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: durations.default, ease: easings.easeOut },
  },
  exit: {
    x: 30,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/** Slides in from the left */
export const slideLeft: Variants = {
  initial: { x: -30, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: durations.default, ease: easings.easeOut },
  },
  exit: {
    x: -30,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/** Plain opacity fade */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.default, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/**
 * Scale-press — suitable for `whileTap` usage.
 * Apply as: `whileTap="press"` with `variants={scalePress}`
 */
export const scalePress: Variants = {
  initial: { scale: 1 },
  press: {
    scale: 0.97,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/** Page route enter */
export const pageEnter: Variants = {
  initial: { x: 30, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
  exit: {
    x: -30,
    opacity: 0,
    transition: { duration: 0.15, ease: easings.easeIn },
  },
};

/** Page route enter — reduced motion version */
export const pageEnterReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
