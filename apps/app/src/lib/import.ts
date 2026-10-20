import type { ApplicationId, ResumeId } from "@huntlog/shared/schema";
import { getEvolu } from "./evolu";

type Row = Record<string, unknown>;

interface HuntlogExport {
  format: "huntlog-export";
  version: 1;
  resumes: Row[];
  applications: Row[];
  prep_notes: Row[];
  leads: Row[];
  resources: Row[];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const opt = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
const toIso = (v: unknown) => {
  const s = opt(v);
  if (!s) return null;
  const d = new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
};

export interface ImportSummary {
  applications: number;
  notes: number;
  leads: number;
  resources: number;
  resumes: number;
}

export async function importExport(json: string): Promise<ImportSummary> {
  const data = JSON.parse(json) as HuntlogExport;
  if (data.format !== "huntlog-export" || data.version !== 1) {
    throw new Error("This file isn't a huntlog export.");
  }

  const evolu = await getEvolu();
  const stored: Promise<void>[] = [];
  const onComplete = () => {
    let resolve!: () => void;
    stored.push(new Promise<void>((r) => (resolve = r)));
    return { onComplete: () => resolve() };
  };
  const resumeIds = new Map<string, ResumeId>();
  const applicationIds = new Map<string, ApplicationId>();

  for (const r of data.resumes) {
    if (!r.data) continue;
    const { id } = evolu.insert(
      "resume",
      {
        label: str(r.label),
        originalFilename: str(r.original_filename),
        mimeType: str(r.mime_type) || "application/pdf",
        data: str(r.data),
        addedAt: toIso(r.uploaded_at),
      },
      onComplete()
    );
    resumeIds.set(str(r.id), id);
  }

  for (const a of data.applications) {
    const { id } = evolu.insert(
      "application",
      {
        company: str(a.company),
        role: str(a.role),
        jobLink: opt(a.job_link),
        source: opt(a.source),
        dateApplied: str(a.date_applied),
        stage: str(a.stage) || "applied",
        nextAction: opt(a.next_action),
        nextActionDue: opt(a.next_action_due),
        contactName: opt(a.contact_name),
        contactInfo: opt(a.contact_info),
        compRange: opt(a.comp_range),
        resumeId: resumeIds.get(str(a.resume_id)) ?? null,
        notes: opt(a.notes),
        tags: Array.isArray(a.tags) && a.tags.length > 0 ? JSON.stringify(a.tags) : null,
        addedAt: toIso(a.created_at),
      },
      onComplete()
    );
    applicationIds.set(str(a.id), id);
  }

  let notes = 0;
  for (const n of data.prep_notes) {
    const applicationId = applicationIds.get(str(n.application_id));
    if (!applicationId) continue;
    evolu.insert(
      "prepNote",
      {
        applicationId,
        stage: str(n.stage),
        note: str(n.note),
        addedAt: toIso(n.created_at),
      },
      onComplete()
    );
    notes++;
  }

  for (const l of data.leads) {
    evolu.insert(
      "lead",
      {
        company: str(l.company),
        role: opt(l.role),
        link: opt(l.link),
        source: opt(l.source),
        notes: opt(l.notes),
        addedAt: toIso(l.created_at),
      },
      onComplete()
    );
  }

  for (const r of data.resources) {
    evolu.insert(
      "resource",
      {
        label: str(r.label),
        url: str(r.url),
        notes: opt(r.notes),
        addedAt: toIso(r.created_at),
      },
      onComplete()
    );
  }

  await Promise.all(stored);

  return {
    applications: applicationIds.size,
    notes,
    leads: data.leads.length,
    resources: data.resources.length,
    resumes: resumeIds.size,
  };
}
