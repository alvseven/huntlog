export function PageCount({ count, total }: { count: number; total?: number }) {
  return (
    <span className="ml-2 align-middle text-base font-normal tabular-nums text-muted-foreground">
      {total !== undefined && total !== count ? `${count} of ${total}` : count}
    </span>
  );
}
