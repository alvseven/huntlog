const DAY_MS = 86_400_000;

export function dayDiff(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function relativeDue(iso: string): string {
  const diff = dayDiff(iso);
  if (diff === 0) return "Today";
  if (diff < 0) return diff === -1 ? "1 day overdue" : `${-diff} days overdue`;
  return diff === 1 ? "In 1 day" : `In ${diff} days`;
}
