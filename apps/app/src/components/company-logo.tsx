import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

function faviconUrl(link: string | null): string | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
  } catch {
    return null;
  }
}

export function CompanyLogo({ jobLink, className }: { jobLink: string | null; className?: string }) {
  const [errored, setErrored] = useState(false);
  const src = faviconUrl(jobLink);

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground",
          className
        )}
      >
        <Building2 className="size-1/2" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("shrink-0 rounded-md border border-border bg-white p-1 object-contain", className)}
      onError={() => setErrored(true)}
    />
  );
}
