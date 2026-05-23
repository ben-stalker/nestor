# Motion Design Scale — Nestor (EPIC-22)

All animation tokens live in `client/src/shared/motion.ts`.

## Duration tokens

| Name      | Value  | Usage                                     |
|-----------|--------|-------------------------------------------|
| `fast`    | 150 ms | Hover effects, tap feedback, small fades  |
| `default` | 250 ms | Cards, list items, modals                 |
| `slow`    | 400 ms | Page transitions, complex reveals         |

## Easing presets

| Name       | Value                                | Usage                                |
|------------|--------------------------------------|--------------------------------------|
| `spring`   | `{ type: spring, damping: 20, stiffness: 300 }` | Physical, snappy interactions |
| `easeOut`  | `[0.0, 0.0, 0.2, 1]`                | Enter animations (decelerating)      |
| `easeIn`   | `[0.4, 0.0, 1, 1]`                  | Exit animations (accelerating)       |

## Common variants

| Export          | Behaviour                                    |
|-----------------|----------------------------------------------|
| `slideUp`       | y 16→0, opacity 0→1                         |
| `slideRight`    | x 30→0, opacity 0→1 (enter from right)      |
| `slideLeft`     | x -30→0, opacity 0→1 (enter from left)      |
| `fadeIn`        | opacity 0→1                                 |
| `scalePress`    | scale 1→0.97 (for whileTap)                 |
| `pageEnter`     | page route entry/exit                        |
| `pageEnterReduced` | opacity-only fallback for reduced motion  |

## Reduced-motion helper

```ts
import { motionSafe } from '../shared/motion';
import useReducedMotion from '../hooks/useReducedMotion';

const rm = useReducedMotion();
const variants = motionSafe(slideUp, rm);
```

When `reducedMotion` is `true`, `motionSafe` returns a simple opacity fade
(100 ms) regardless of the passed variants.  This ensures animations never
play for users who have opted out via OS or app settings.

## Principles

1. **Purposeful** — animations guide attention, not decorate.
2. **Snappy** — exit ≤ enter.  User should never wait for an exit to finish.
3. **Accessible** — always check `useReducedMotion()` and apply `motionSafe()`.
4. **Consistent** — use tokens from this file; do not hard-code durations.
