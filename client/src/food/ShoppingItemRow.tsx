import { motion } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';
import type { ShoppingItem } from './types';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onTick: (id: number, ticked: boolean) => void;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
}

export default function ShoppingItemRow({
  item,
  onTick,
  onApprove,
  onDecline,
}: ShoppingItemRowProps) {
  const rm = useReducedMotion();
  const isTicked = item.ticked === 1;

  return (
    <motion.div
      layout={!rm}
      initial={rm ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={
        rm
          ? { opacity: 1 }
          : { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } }
      }
      exit={
        rm
          ? { opacity: 0 }
          : {
              opacity: 0,
              height: 0,
              paddingTop: 0,
              paddingBottom: 0,
              overflow: 'hidden',
              transition: { duration: 0.2 },
            }
      }
      className={`flex items-center gap-3 py-2 px-1 ${isTicked ? 'opacity-50' : ''}`}
      data-testid="shopping-item-row"
    >
      <motion.button
        type="button"
        onClick={() => onTick(item.id, !isTicked)}
        aria-label={isTicked ? `Untick ${item.name}` : `Tick ${item.name}`}
        whileTap={rm ? undefined : { scale: 0.9 }}
        className={`size-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          isTicked
            ? 'border-accent bg-accent text-white'
            : 'border-surface-elev bg-surface hover:border-accent'
        }`}
      >
        {isTicked && (
          <svg
            className="size-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </motion.button>

      <span className={`flex-1 text-body text-primary ${isTicked ? 'line-through' : ''}`}>
        {item.name}
      </span>

      {(item.quantity != null || item.unit) && (
        <span className="text-caption text-secondary flex-shrink-0">
          {item.quantity != null ? item.quantity : ''}
          {item.unit ? ` ${item.unit}` : ''}
        </span>
      )}

      {onApprove && (
        <button
          type="button"
          onClick={() => onApprove(item.id)}
          aria-label={`Approve ${item.name}`}
          className="text-caption text-accent hover:underline flex-shrink-0"
        >
          Approve
        </button>
      )}

      {onDecline && (
        <button
          type="button"
          onClick={() => onDecline(item.id)}
          aria-label={`Decline ${item.name}`}
          className="text-caption text-secondary hover:text-red-500 flex-shrink-0"
        >
          Decline
        </button>
      )}
    </motion.div>
  );
}
