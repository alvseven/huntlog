import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import type { Lead, LeadUpdate } from "@huntlog/shared";
import { useApi } from "@/lib/api-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Field } from "@/components/field";
import { SourceSelect } from "@/components/source-select";
import { SOURCE_LABELS, type Source } from "@huntlog/shared";
import { SourceIcon } from "@/components/source-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useDataVersion } from "@/lib/use-data-version";
export default function Leads() {
  const api = useApi();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => api.listLeads().then(setLeads);

  const version = useDataVersion();
  useEffect(() => {
    load();
  }, [version]);

  const graduate = async (id: string, overrides: { source: string | null }) => {
    const app = await api.graduateLead(id, overrides);
    load();
    toast.success(`${app.company} moved to Applications`);
    navigate(`/applications/${app.id}`);
  };

  const remove = async (id: string, company: string) => {
    await api.deleteLead(id);
    load();
    toast.success(`Removed ${company} from leads`);
  };

  const update = async (id: string, data: LeadUpdate) => {
    await api.updateLead(id, data);
    load();
    toast.success("Lead updated");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Companies you're considering, not yet applied.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              New lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <NewLeadForm
              onCreated={() => {
                setOpen(false);
                load();
                toast.success("Lead added");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {!leads ? (
        <Skeleton className="h-64 w-full" />
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">No leads yet</p>
          <p className="text-sm text-muted-foreground">
            Add companies you're eyeing before you apply.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {leads.map((l) => (
              <li key={l.id} className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {l.link ? (
                      <a
                        href={l.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-sm font-medium hover:underline"
                      >
                        <span className="truncate">{l.company}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    ) : (
                      <span className="block truncate text-sm font-medium">{l.company}</span>
                    )}
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[l.role, l.source ? (SOURCE_LABELS[l.source as Source] ?? l.source) : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <EditLeadDialog lead={l} onSave={(data) => update(l.id, data)} />
                    <DeleteLeadDialog lead={l} onConfirm={() => remove(l.id, l.company)} />
                  </div>
                </div>
                {l.notes && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{l.notes}</p>
                )}
                <div className="mt-2 -ml-3">
                  <GraduateDialog lead={l} onConfirm={(overrides) => graduate(l.id, overrides)} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.link ? (
                        <a
                          href={l.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {l.company}
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        </a>
                      ) : (
                        l.company
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.role ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.source ? (
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <SourceIcon source={l.source} />
                          {SOURCE_LABELS[l.source as Source] ?? l.source}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-56 text-xs text-muted-foreground">
                      {l.notes ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block cursor-default truncate">{l.notes}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs whitespace-pre-wrap">
                            {l.notes}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <GraduateDialog
                          lead={l}
                          onConfirm={(overrides) => graduate(l.id, overrides)}
                        />
                        <EditLeadDialog lead={l} onSave={(data) => update(l.id, data)} />
                        <DeleteLeadDialog lead={l} onConfirm={() => remove(l.id, l.company)} />
                      </div>
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

function GraduateDialog({
  lead,
  onConfirm,
}: {
  lead: Lead;
  onConfirm: (overrides: { source: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string | null>(lead.source);

  const openChange = (next: boolean) => {
    if (next) {
      setSource(lead.source);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <GraduationCap className="size-4" />
          Graduate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Graduate {lead.company} to an application?</DialogTitle>
          <DialogDescription>
            This creates a new application in the "Applied" stage, dated today, and removes it from
            your leads backlog. Confirm how you actually applied — it may differ from how you first
            found this lead.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Applied via">
            <SourceSelect value={source} onChange={setSource} allowNone={false} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              onConfirm({ source });
            }}
          >
            Graduate to application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLeadDialog({ lead, onSave }: { lead: Lead; onSave: (data: LeadUpdate) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${lead.company}`}>
          <Pencil className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EditLeadForm
          lead={lead}
          onSaved={(data) => {
            setOpen(false);
            onSave(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditLeadForm({ lead, onSaved }: { lead: Lead; onSaved: (data: LeadUpdate) => void }) {
  const [company, setCompany] = useState(lead.company);
  const [role, setRole] = useState(lead.role ?? "");
  const [link, setLink] = useState(lead.link ?? "");
  const [source, setSource] = useState<string | null>(lead.source);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    onSaved({
      company,
      role: role || null,
      link: link || null,
      source,
      notes: notes || null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit lead</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required autoFocus />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Field label="Link">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Source">
          <SourceSelect value={source} onChange={setSource} />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving || !company}>
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteLeadDialog({ lead, onConfirm }: { lead: Lead; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Remove lead">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {lead.company}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This lead will be permanently removed from your backlog.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewLeadForm({ onCreated }: { onCreated: () => void }) {
  const api = useApi();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSubmitting(true);
    try {
      await api.createLead({
        company,
        role: role || null,
        link: link || null,
        source,
        notes: notes || null,
      });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>New lead</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required autoFocus />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Field label="Link">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Source">
          <SourceSelect value={source} onChange={setSource} />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || !company}>
          {submitting ? "Adding…" : "Add lead"}
        </Button>
      </DialogFooter>
    </form>
  );
}
