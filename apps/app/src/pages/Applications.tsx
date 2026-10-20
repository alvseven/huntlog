import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { STAGES, STAGE_LABELS, type Application } from "@huntlog/shared";
import { useApi } from "@/lib/api-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StageBadge } from "@/components/stage-badge";
import { CompanyLogo } from "@/components/company-logo";
import { TagsInput } from "@/components/tags-input";
import { Field } from "@/components/field";
import { SourceSelect } from "@/components/source-select";
import { DatePicker } from "@/components/date-picker";
import { ResumePicker } from "@/components/resume-picker";
import { relativeDue } from "@/lib/dates";

import { useDataVersion } from "@/lib/use-data-version";
export default function Applications() {
  const api = useApi();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => api.listApplications().then(setApps);

  const version = useDataVersion();
  useEffect(() => {
    load();
  }, [version]);

  const filtered = useMemo(
    () => (!apps ? [] : stageFilter === "all" ? apps : apps.filter((a) => a.stage === stageFilter)),
    [apps, stageFilter]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything you've applied to.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-44 sm:w-52" aria-label="Filter by stage">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                New application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
              <NewApplicationForm
                onCreated={() => {
                  setOpen(false);
                  load();
                  toast.success("Application added");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {!apps ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState hasApps={apps.length > 0} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/applications/${a.id}`)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted/50"
                >
                  <CompanyLogo jobLink={a.job_link} className="mt-0.5 size-8" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium">{a.company}</span>
                      <StageBadge stage={a.stage} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.role}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Applied {a.date_applied}
                      {a.next_action_due && ` · ${relativeDue(a.next_action_due)}`}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Next action due</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    data-clickable="true"
                    onClick={() => navigate(`/applications/${a.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo jobLink={a.job_link} className="size-6" />
                        {a.company}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.role}</TableCell>
                    <TableCell>
                      <StageBadge stage={a.stage} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.date_applied}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.next_action_due ? (
                        <span title={a.next_action_due}>{relativeDue(a.next_action_due)}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {a.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {a.tags.map((t) => (
                            <Badge key={t.id} variant="muted">
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ hasApps }: { hasApps: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium">
        {hasApps ? "No applications match this filter" : "No applications yet"}
      </p>
      <p className="text-sm text-muted-foreground">
        {hasApps ? "Try a different stage." : "Add your first application to start tracking."}
      </p>
    </div>
  );
}

function NewApplicationForm({ onCreated }: { onCreated: () => void }) {
  const api = useApi();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().slice(0, 10));
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const version = useDataVersion();
  useEffect(() => {
    api.listTags().then((tags) => setTagSuggestions(tags.map((t) => t.name)));
  }, [version]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) return;
    setSubmitting(true);
    try {
      await api.createApplication({
        company,
        role,
        job_link: jobLink || null,
        source,
        date_applied: dateApplied,
        stage: "applied",
        next_action: null,
        next_action_due: null,
        contact_name: null,
        contact_info: null,
        comp_range: null,
        resume_id: resumeId,
        notes: null,
        tagNames,
      });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>New application</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required autoFocus />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} required />
        </Field>
        <Field label="Job link">
          <Input
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="Source">
          <SourceSelect value={source} onChange={setSource} />
        </Field>
        <Field label="Date applied">
          <DatePicker value={dateApplied} onChange={(v) => setDateApplied(v ?? dateApplied)} />
        </Field>
        <Field label="Resume">
          <ResumePicker value={resumeId} onChange={setResumeId} />
        </Field>
        <Field label="Tags">
          <TagsInput value={tagNames} onChange={setTagNames} suggestions={tagSuggestions} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || !company || !role}>
          {submitting ? "Adding…" : "Add application"}
        </Button>
      </DialogFooter>
    </form>
  );
}
