/**
 * PageTransition — EPIC-22 STORY-22.2
 *
 * Wrap each top-level page component with this to get consistent route
 * transition animations.  Uses AnimatePresence in the router to trigger
 * enter/exit.
 */

import { motion } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';
import { pageEnter, pageEnterReduced } from './motion';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Override layout key if needed */
  className?: string;
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  const rm = useReducedMotion();
  const variants = rm ? pageEnterReduced : pageEnter;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'contents' }}
    >
      {children}
    </motion.div>
  );
}
