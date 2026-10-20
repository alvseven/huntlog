import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, CircleCheck, AlertCircle, Clock } from "lucide-react";
import {
  STAGES,
  STAGE_LABELS,
  CLOSED_STAGES,
  type Application,
  type Stage,
  type StatsResponse,
} from "@huntlog/shared";
import { useApi } from "@/lib/api-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company-logo";
import { StageBadge } from "@/components/stage-badge";
import { SparklineBars } from "@/components/sparkline-bars";
import { dayDiff, relativeDue } from "@/lib/dates";

import { useDataVersion } from "@/lib/use-data-version";
const FUNNEL_COLOR: Record<Stage, string> = {
  applied: "var(--stage-applied-fg)",
  recruiter_screen: "var(--stage-recruiter-fg)",
  technical_interview: "var(--stage-technical-fg)",
  offer: "var(--stage-offer-fg)",
  rejected: "var(--stage-rejected-fg)",
  accepted: "var(--stage-accepted-fg)",
};

const IN_PROCESS_STAGES: Stage[] = ["recruiter_screen", "technical_interview", "offer"];
const PERIODS = [7, 14, 30] as const;
type Period = (typeof PERIODS)[number];

const DAY_MS = 86_400_000;

function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return display;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() - n * DAY_MS);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function relativeApplied(iso: string) {
  const diff = -dayDiff(iso);
  if (diff <= 0) return "Today";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

export default function Dashboard() {
  const api = useApi();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [period, setPeriod] = useState<Period>(7);

  const version = useDataVersion();
  useEffect(() => {
    api.getStats().then(setStats);
    api.listApplications().then(setApplications);
  }, [version]);

  const awaitingResponse = applications?.filter((a) => a.stage === "applied") ?? [];
  const inProcess = applications?.filter((a) => IN_PROCESS_STAGES.includes(a.stage)) ?? [];

  const recent = applications
    ? [...applications].sort((a, b) => b.date_applied.localeCompare(a.date_applied)).slice(0, 6)
    : [];

  const today = isoDate(daysAgo(0));
  const in7Days = isoDate(new Date(daysAgo(0).getTime() + 7 * DAY_MS));
  const upcoming = (applications ?? [])
    .filter(
      (a) => !CLOSED_STAGES.includes(a.stage) && a.next_action_due && a.next_action_due >= today && a.next_action_due <= in7Days
    )
    .sort((a, b) => (a.next_action_due ?? "").localeCompare(b.next_action_due ?? ""));

  const overdue = stats?.overdueFollowUps ?? [];

  const appliedInPeriod = applications
    ? applications.filter((a) => dayDiff(a.date_applied) >= -period + 1).length
    : 0;

  const sparklineData = applications
    ? Array.from({ length: period }, (_, i) => {
        const day = isoDate(daysAgo(period - 1 - i));
        return { date: day, count: applications.filter((a) => a.date_applied === day).length };
      })
    : [];

  const maxFunnelCount = stats ? Math.max(1, ...STAGES.map((s) => stats.funnel[s] ?? 0)) : 1;

  const awaitingCount = useCountUp(awaitingResponse.length);
  const inProcessCount = useCountUp(inProcess.length);
  const appliedCount = useCountUp(appliedInPeriod);
  const leadsCount = useCountUp(stats?.totalLeads ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your job search, at a glance.</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                  {applications ? awaitingCount : <Skeleton className="h-8 w-8" />}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Awaiting response</div>
              </div>
              {applications && awaitingResponse.length > 0 && (
                <LogoStack apps={awaitingResponse} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-display text-2xl font-semibold tracking-[-0.02em] tabular-nums">
              {applications ? inProcessCount : <Skeleton className="h-8 w-8" />}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">In process</div>
            {applications && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {IN_PROCESS_STAGES.map((s) => {
                  const count = inProcess.filter((a) => a.stage === s).length;
                  if (!count) return null;
                  return (
                    <span key={s} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: FUNNEL_COLOR[s] }} />
                      {count} {STAGE_LABELS[s]}
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                  {applications ? appliedCount : <Skeleton className="h-8 w-8" />}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Applied, last {period}d</div>
              </div>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                      p === period
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>
            {applications ? (
              <SparklineBars data={sparklineData} className="mt-3 h-8" />
            ) : (
              <Skeleton className="mt-3 h-8 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats ? (
              STAGES.map((stage) => {
                const count = stats.funnel[stage] ?? 0;
                const pct = (count / maxFunnelCount) * 100;
                return (
                  <div key={stage} className="grid grid-cols-[152px_1fr_2rem] items-center gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: FUNNEL_COLOR[stage] }} />
                      <span className="truncate">{STAGE_LABELS[stage]}</span>
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{ width: `${pct}%`, background: FUNNEL_COLOR[stage] }}
                      />
                    </div>
                    <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{count}</span>
                  </div>
                );
              })
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads backlog</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-5 pt-0">
              <div className="font-display text-2xl font-semibold tabular-nums">
                {stats ? leadsCount : <Skeleton className="h-8 w-8" />}
              </div>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-2 hover:underline"
              >
                View leads
                <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats || !applications ? (
                <Skeleton className="h-16 w-full" />
              ) : overdue.length === 0 && upcoming.length === 0 ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <CircleCheck className="size-4 text-success" />
                  Nothing due. Nice.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {overdue.length > 0 && (
                    <FollowUpGroup label="Overdue" icon={AlertCircle} tone="destructive" items={overdue} />
                  )}
                  {upcoming.length > 0 && (
                    <FollowUpGroup label="Upcoming" icon={Clock} tone="warning" items={upcoming} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent applications</CardTitle>
        </CardHeader>
        <CardContent>
          {!applications ? (
            <Skeleton className="h-40 w-full" />
          ) : recent.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="first:pt-0 last:pb-0">
                  <Link
                    to={`/applications/${a.id}`}
                    className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/60"
                  >
                    <CompanyLogo jobLink={a.job_link} className="size-9 shrink-0 p-1.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{a.company}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="truncate">{a.role}</span>
                        <span>·</span>
                        <span className="shrink-0">{relativeApplied(a.date_applied)}</span>
                        {a.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {a.tags.slice(0, 2).map((t) => (
                              <Badge key={t.id} variant="muted" className="px-1.5 py-0 text-[10px]">
                                {t.name}
                              </Badge>
                            ))}
                            {a.tags.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">+{a.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StageBadge stage={a.stage} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogoStack({ apps }: { apps: Application[] }) {
  return (
    <div className="flex shrink-0 items-center">
      {apps.slice(0, 4).map((a) => (
        <CompanyLogo
          key={a.id}
          jobLink={a.job_link}
          className="size-7 -ml-2 rounded-full border-2 border-card p-1 first:ml-0"
        />
      ))}
      {apps.length > 4 && (
        <div className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
          +{apps.length - 4}
        </div>
      )}
    </div>
  );
}

function FollowUpGroup({
  label,
  icon: Icon,
  tone,
  items,
}: {
  label: string;
  icon: typeof AlertCircle;
  tone: "destructive" | "warning";
  items: Application[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className={cn("size-3.5", tone === "destructive" ? "text-destructive" : "text-warning")} />
        {label}
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((a) => (
          <li key={a.id} className="first:pt-0 last:pb-0">
            <Link
              to={`/applications/${a.id}`}
              className="group -mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
                  {a.company}
                  <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.next_action ?? "Follow up"}</p>
              </div>
              <Badge variant={tone} className="shrink-0">
                {relativeDue(a.next_action_due!)}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
