import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Pencil, Trash2, Check, X } from "lucide-react";
import {
  STAGES,
  STAGE_LABELS,
  type Application,
  type ApplicationWriteFields,
  type PrepNote,
} from "@huntlog/shared";
import { useApi } from "@/lib/api-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StageBadge, STAGE_STYLE } from "@/components/stage-badge";
import { CompanyLogo } from "@/components/company-logo";
import { TagsInput } from "@/components/tags-input";
import { Field } from "@/components/field";
import { SourceSelect } from "@/components/source-select";
import { DatePicker } from "@/components/date-picker";
import { ResumePicker } from "@/components/resume-picker";
import { SOURCE_LABELS, type Source } from "@huntlog/shared";
import { SourceIcon } from "@/components/source-icon";
import { ArrowUpRight as ExternalIcon, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { relativeDue } from "@/lib/dates";

import { useDataVersion } from "@/lib/use-data-version";
const EDIT_FIELDS: Array<{
  key: keyof ApplicationWriteFields;
  label: string;
  type?: "text" | "date" | "select-source";
}> = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "job_link", label: "Job link" },
  { key: "source", label: "Source", type: "select-source" },
  { key: "date_applied", label: "Date applied", type: "date" },
  { key: "next_action", label: "Next action" },
  { key: "next_action_due", label: "Next action due", type: "date" },
  { key: "contact_name", label: "Contact name" },
  { key: "contact_info", label: "Contact info" },
  { key: "comp_range", label: "Comp range" },
];

export default function ApplicationDetail() {
  const api = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [missing, setMissing] = useState(false);
  const [notes, setNotes] = useState<PrepNote[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteStage, setNewNoteStage] = useState<string>("applied");
  const [addingNote, setAddingNote] = useState(false);

  const load = () => {
    if (!id) return;
    api.getApplication(id).then(
      (a) => {
        setApp(a);
        setMissing(false);
        setNewNoteStage(a.stage);
      },
      () => setMissing(true)
    );
    api.listNotes(id).then(setNotes);
  };

  const version = useDataVersion();
  useEffect(load, [id, version]);

  if (missing || !id) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <h1 className="text-xl font-semibold">This application doesn't exist anymore</h1>
        <p className="text-muted-foreground">It may have been deleted on another device.</p>
        <Button asChild variant="outline">
          <Link to="/applications">
            <ArrowLeft className="size-4" />
            Back to applications
          </Link>
        </Button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const updateStage = async (stage: Application["stage"]) => {
    const updated = await api.updateApplication(id, { stage });
    setApp(updated);
    setNewNoteStage(stage);
    toast.success("Stage updated");
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.addNote(id, { application_id: id, stage: newNoteStage, note: newNote });
      setNewNote("");
      api.listNotes(id).then(setNotes);
      toast.success("Note added");
    } finally {
      setAddingNote(false);
    }
  };

  const remove = async () => {
    await api.deleteApplication(id);
    toast.success(`Deleted ${app.company}`);
    navigate("/applications");
  };

  const updateNote = async (noteId: string, data: { stage?: string; note?: string }) => {
    await api.updateNote(id, noteId, data);
    api.listNotes(id).then(setNotes);
    toast.success("Note updated");
  };

  const removeNote = async (noteId: string) => {
    await api.deleteNote(id, noteId);
    api.listNotes(id).then(setNotes);
    toast.success("Note deleted");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to applications
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo jobLink={app.job_link} className="mt-0.5 size-10" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight break-words">
              {app.company} — {app.role}
            </h1>
            {app.job_link && (
              <a
                href={app.job_link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:underline"
              >
                <span className="truncate">{app.job_link}</span>
                <ArrowUpRight className="size-3.5 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="flex h-8 items-center gap-3">
          <Select value={app.stage} onValueChange={(v) => updateStage(v as Application["stage"])}>
            <SelectTrigger
              className="h-8 w-auto min-w-40 justify-center gap-2 rounded-full border-transparent px-4 font-medium [&>svg]:shrink-0"
              style={STAGE_STYLE[app.stage]}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: "currentColor" }}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-1.5">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                <EditApplicationForm
                  app={app}
                  onSaved={(updated) => {
                    setApp(updated);
                    setEditOpen(false);
                    toast.success("Application updated");
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Delete application"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete application for {app.company}?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">This cannot be undone.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={remove}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6 lg:order-1">
          {app.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{app.notes}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Interview prep notes</h2>

            <Card className="mb-5">
              <CardContent className="p-4">
                <form onSubmit={addNote} className="flex flex-col gap-3">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Who you talked to, questions asked, how it went…"
                    className="min-h-16 resize-none border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                    <Field label="Stage" className="w-48">
                      <Select value={newNoteStage} onValueChange={setNewNoteStage}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8"
                      disabled={addingNote || !newNote.trim()}
                    >
                      {addingNote ? "Adding…" : "Add note"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-sm font-medium">No prep notes yet</p>
                <p className="text-sm text-muted-foreground">
                  Jot down how each round goes as you move through the process.
                </p>
              </div>
            ) : (
              <div className="relative flex flex-col gap-5">
                <div className="absolute bottom-2 left-[5px] top-2 w-px bg-border" aria-hidden />
                {notes.map((n) => (
                  <PrepNoteCard
                    key={n.id}
                    note={n}
                    onUpdate={(data) => updateNote(n.id, data)}
                    onDelete={() => removeNote(n.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:order-2">
          {app.resume && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    void api.openResume(app.resume!.id);
                  }}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{app.resume.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      Uploaded{" "}
                      {new Date(app.resume.uploaded_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <ExternalIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </CardContent>
            </Card>
          )}

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              <DetailField
                label="Source"
                value={
                  app.source ? (
                    <span className="flex items-center gap-1.5">
                      <SourceIcon source={app.source} />
                      {SOURCE_LABELS[app.source as Source] ?? app.source}
                    </span>
                  ) : null
                }
              />
              <DetailField label="Applied" value={app.date_applied} mono />
              <DetailField label="Next action" value={app.next_action} />
              <DetailField
                label="Next action due"
                value={
                  app.next_action_due ? (
                    <span title={app.next_action_due}>{relativeDue(app.next_action_due)}</span>
                  ) : null
                }
              />
              <DetailField label="Comp range" value={app.comp_range} />
              <DetailField label="Contact" value={app.contact_name} />
              <DetailField label="Contact info" value={app.contact_info} />
              <DetailField
                label="Tags"
                value={
                  app.tags.length === 0 ? null : (
                    <div className="flex flex-wrap justify-end gap-1">
                      {app.tags.map((t) => (
                        <Badge key={t.id} variant="muted">
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <div className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-right text-sm">
        {isEmpty ? (
          <span className="text-muted-foreground">Not set</span>
        ) : (
          <span className={mono ? "font-mono" : undefined}>{value}</span>
        )}
      </div>
    </div>
  );
}

function PrepNoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: PrepNote;
  onUpdate: (data: { stage?: string; note?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draftStage, setDraftStage] = useState(note.stage);
  const [draftNote, setDraftNote] = useState(note.note);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraftStage(note.stage);
    setDraftNote(note.note);
    setEditing(true);
  };

  const save = async () => {
    if (!draftNote.trim()) return;
    setSaving(true);
    try {
      await onUpdate({ stage: draftStage, note: draftNote });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex gap-4 pl-6">
      <span
        className="absolute left-0 top-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-background"
        style={{ backgroundColor: STAGE_STYLE[note.stage as Application["stage"]].color as string }}
      />
      <div className="group min-w-0 flex-1 rounded-lg border border-border bg-card p-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <Select value={draftStage} onValueChange={setDraftStage}>
              <SelectTrigger className="h-8 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              className="min-h-20"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={save} disabled={saving || !draftNote.trim()}>
                <Check className="size-3.5" />
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <StageBadge stage={note.stage as Application["stage"]} />
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex items-center transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Edit note"
                    onClick={startEdit}
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Delete note"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
            {confirmingDelete ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Delete this note?</span>
                <div className="flex items-center gap-1.5">
                  <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Cancel delete"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{note.note}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EditApplicationForm({
  app,
  onSaved,
}: {
  app: Application;
  onSaved: (updated: Application) => void;
}) {
  const api = useApi();
  const [draft, setDraft] = useState<ApplicationWriteFields>(app);
  const [tagNames, setTagNames] = useState<string[]>(app.tags.map((t) => t.name));
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const version = useDataVersion();
  useEffect(() => {
    api.listTags().then((tags) => setTagSuggestions(tags.map((t) => t.name)));
  }, [version]);

  const set = (key: keyof ApplicationWriteFields, value: string) =>
    setDraft((d) => ({ ...d, [key]: value || null }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateApplication(app.id, { ...draft, tagNames });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit application</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        {EDIT_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "select-source" ? (
              <SourceSelect
                value={(draft[f.key] as string) ?? null}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            ) : f.type === "date" ? (
              <DatePicker
                value={(draft[f.key] as string) ?? null}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                clearable={f.key === "next_action_due"}
              />
            ) : (
              <Input
                value={(draft[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </Field>
        ))}
        <Field label="Resume">
          <ResumePicker
            value={draft.resume_id}
            onChange={(v) => setDraft((d) => ({ ...d, resume_id: v }))}
          />
        </Field>
        <Field label="Tags">
          <TagsInput value={tagNames} onChange={setTagNames} suggestions={tagSuggestions} />
        </Field>
        <Field label="Notes">
          <Textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))}
            className="min-h-32"
          />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
