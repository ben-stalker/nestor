interface Props {
  balance: number;
  target?: number;
}

export default function StarBalanceChip({ balance, target = 10 }: Props) {
  const filled = balance % target;
  return (
    <div
      className="star-balance-chip"
      aria-label={`${balance} stars total, ${filled} toward next reward`}
    >
      <span className="star-balance-chip__count">{balance}</span>
      <svg
        className="star-balance-chip__icon"
        viewBox="0 0 20 20"
        aria-hidden="true"
        width="16"
        height="16"
      >
        <path
          d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
