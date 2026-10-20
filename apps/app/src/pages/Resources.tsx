import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { ResourceLink, ResourceLinkUpdate, Resume } from "@huntlog/shared";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Field } from "@/components/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useDataVersion } from "@/lib/use-data-version";
function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Resources() {
  const api = useApi();
  const [links, setLinks] = useState<ResourceLink[] | null>(null);
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    api.listResources().then(setLinks);
    api.listResumes().then(setResumes);
  };

  const version = useDataVersion();
  useEffect(() => {
    load();
  }, [version]);

  const remove = async (id: string, label: string) => {
    await api.deleteResource(id);
    load();
    toast.success(`Removed ${label}`);
  };

  const removeResume = async (id: string, label: string) => {
    await api.deleteResume(id);
    load();
    toast.success(`Deleted ${label}`);
  };

  const update = async (id: string, data: ResourceLinkUpdate) => {
    await api.updateResource(id, data);
    load();
    toast.success("Link updated");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Job boards, tools, and other useful links for your search.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              New link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <NewResourceForm
              onCreated={() => {
                setOpen(false);
                load();
                toast.success("Link added");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {!links ? (
        <Skeleton className="h-48 w-full" />
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">No resources yet</p>
          <p className="text-sm text-muted-foreground">
            Add job boards or tools you keep coming back to.
          </p>
        </div>
      ) : (
        <Table containerClassName="max-h-[375px] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 bg-background [&_tr]:bg-muted/50">
            <TableRow>
              <TableHead>Link</TableHead>
              <TableHead className="hidden sm:table-cell">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    {r.label}
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </a>
                  <div className="text-xs text-muted-foreground">{hostname(r.url)}</div>
                </TableCell>
                <TableCell className="hidden max-w-80 text-sm text-muted-foreground sm:table-cell">
                  {r.notes ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block cursor-default truncate">{r.notes}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-wrap">
                        {r.notes}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditResourceDialog resource={r} onSave={(data) => update(r.id, data)} />
                    <DeleteResourceDialog resource={r} onConfirm={() => remove(r.id, r.label)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Uploaded resumes</h2>
        <Card>
          <CardHeader>
            <CardTitle>All versions you've uploaded from an application form</CardTitle>
          </CardHeader>
          <CardContent>
            {!resumes ? (
              <Skeleton className="h-16 w-full" />
            ) : resumes.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No resumes uploaded yet — upload one from an application's form.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {resumes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{r.label}</span>
                      <span className="hidden truncate text-muted-foreground sm:inline">
                        {r.original_filename}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          void api.openResume(r.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        View
                        <ArrowUpRight className="size-3" />
                      </a>
                      <DeleteResumeDialog
                        resume={r}
                        onConfirm={() => removeResume(r.id, r.label)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditResourceDialog({
  resource,
  onSave,
}: {
  resource: ResourceLink;
  onSave: (data: ResourceLinkUpdate) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${resource.label}`}>
          <Pencil className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EditResourceForm
          resource={resource}
          onSaved={(data) => {
            setOpen(false);
            onSave(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditResourceForm({
  resource,
  onSaved,
}: {
  resource: ResourceLink;
  onSaved: (data: ResourceLinkUpdate) => void;
}) {
  const [label, setLabel] = useState(resource.label);
  const [url, setUrl] = useState(resource.url);
  const [notes, setNotes] = useState(resource.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !url) return;
    onSaved({ label, url, notes: notes || null });
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit resource link</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Field label="Label">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} required autoFocus />
        </Field>
        <Field label="URL">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            required
          />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={!label || !url}>
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteResourceDialog({
  resource,
  onConfirm,
}: {
  resource: ResourceLink;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Remove ${resource.label}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {resource.label}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This link will be permanently removed from your resources.
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

function DeleteResumeDialog({ resume, onConfirm }: { resume: Resume; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={`Delete ${resume.label}`}
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {resume.label}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This file will be permanently deleted. Any applications using it will show no resume
          attached.
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
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewResourceForm({ onCreated }: { onCreated: () => void }) {
  const api = useApi();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !url) return;
    setSubmitting(true);
    try {
      await api.createResource({ label, url, notes: notes || null });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col">
      <DialogHeader>
        <DialogTitle>New resource link</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Field label="Label">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} required autoFocus />
        </Field>
        <Field label="URL">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            required
          />
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || !label || !url}>
          {submitting ? "Adding…" : "Add link"}
        </Button>
      </DialogFooter>
    </form>
  );
}
