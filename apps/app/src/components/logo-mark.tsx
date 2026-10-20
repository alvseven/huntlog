const DOTS = [
  [30, 110],
  [70, 30],
  [70, 70],
  [70, 110],
  [150, 30],
  [190, 30],
  [150, 70],
  [190, 70],
] as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -40 220 220" fill="currentColor" className={className} aria-hidden="true">
      {DOTS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={18} />
      ))}
    </svg>
  );
}
