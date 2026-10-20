import {
  UserPlus,
  Send,
  UserSearch,
  Briefcase,
  Globe,
  Twitter,
  Linkedin,
  HeartHandshake,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { Source } from "@huntlog/shared";
import { cn } from "@/lib/utils";

export const SOURCE_ICONS: Record<Source, LucideIcon> = {
  referral: UserPlus,
  cold_outreach: Send,
  recruiter: UserSearch,
  job_board: Briefcase,
  company_website: Globe,
  x_twitter: Twitter,
  linkedin: Linkedin,
  warm_intro: HeartHandshake,
  other: MoreHorizontal,
};

export function SourceIcon({ source, className }: { source: string | null; className?: string }) {
  const Icon = source && source in SOURCE_ICONS ? SOURCE_ICONS[source as Source] : null;
  if (!Icon) return null;
  return <Icon className={cn("size-3.5 shrink-0 text-muted-foreground", className)} />;
}
