import type { CSSProperties } from "react";
import { STAGE_LABELS, CLOSED_STAGES, type Stage } from "@huntlog/shared";
import { Badge } from "./ui/badge";

export const STAGE_STYLE: Record<Stage, CSSProperties> = {
  applied: { backgroundColor: "var(--stage-applied-bg)", color: "var(--stage-applied-fg)" },
  recruiter_screen: { backgroundColor: "var(--stage-recruiter-bg)", color: "var(--stage-recruiter-fg)" },
  technical_interview: { backgroundColor: "var(--stage-technical-bg)", color: "var(--stage-technical-fg)" },
  offer: { backgroundColor: "var(--stage-offer-bg)", color: "var(--stage-offer-fg)" },
  rejected: { backgroundColor: "var(--stage-rejected-bg)", color: "var(--stage-rejected-fg)" },
  accepted: { backgroundColor: "var(--stage-accepted-bg)", color: "var(--stage-accepted-fg)" },
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge
      variant="outline"
      className={`border-transparent font-medium ${CLOSED_STAGES.includes(stage) ? "opacity-90" : ""}`}
      style={STAGE_STYLE[stage]}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
