import * as Evolu from "@evolu/common";
import {
  CLOSED_STAGES,
  STAGES,
  type Application,
  type ApplicationInput,
  type ApplicationUpdate,
  type Lead,
  type LeadInput,
  type LeadUpdate,
  type PrepNote,
  type PrepNoteInput,
  type Resume,
  type ResourceLink,
  type ResourceLinkInput,
  type ResourceLinkUpdate,
  type Stage,
  type StatsResponse,
  type Tag,
} from "./index";
import {
  createQuery,
  type AppSchema,
  type ApplicationId,
  type LeadId,
  type PrepNoteId,
  type ResourceId,
  type ResumeId,
} from "./schema";

type Table = keyof AppSchema;

const notDeleted = Evolu.sqliteTrue;

const applicationsQuery = createQuery((db) =>
  db.selectFrom("application").selectAll().where("isDeleted", "is not", notDeleted),
);
const prepNotesQuery = createQuery((db) =>
  db.selectFrom("prepNote").selectAll().where("isDeleted", "is not", notDeleted),
);
const leadsQuery = createQuery((db) =>
  db.selectFrom("lead").selectAll().where("isDeleted", "is not", notDeleted),
);
const resourcesQuery = createQuery((db) =>
  db.selectFrom("resource").selectAll().where("isDeleted", "is not", notDeleted),
);
const resumesQuery = createQuery((db) =>
  db
    .selectFrom("resume")
    .select(["id", "label", "originalFilename", "addedAt", "createdAt"])
    .where("isDeleted", "is not", notDeleted),
);

type ApplicationRow = typeof applicationsQuery.Row;
type PrepNoteRow = typeof prepNotesQuery.Row;
type LeadRow = typeof leadsQuery.Row;
type ResourceRow = typeof resourcesQuery.Row;
type ResumeRow = typeof resumesQuery.Row;

const added = (row: { addedAt: string | null; createdAt: string | null }) =>
  row.addedAt ?? row.createdAt ?? new Date(0).toISOString();

const byNewest =
  <T>(key: (row: T) => string) =>
  (a: T, b: T) =>
    key(b).localeCompare(key(a));

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function normalizeTags(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  }
  return [...seen.values()];
}

const toTag = (name: string): Tag => ({ id: name.toLowerCase(), name });

function toResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    label: row.label ?? "",
    original_filename: row.originalFilename ?? "",
    uploaded_at: added(row),
  };
}

function toApplication(row: ApplicationRow, resumes: Map<string, Resume>): Application {
  return {
    id: row.id,
    company: row.company ?? "",
    role: row.role ?? "",
    job_link: row.jobLink,
    source: row.source,
    date_applied: row.dateApplied ?? "",
    stage: (row.stage ?? "applied") as Stage,
    next_action: row.nextAction,
    next_action_due: row.nextActionDue,
    contact_name: row.contactName,
    contact_info: row.contactInfo,
    comp_range: row.compRange,
    resume_id: row.resumeId,
    resume: row.resumeId ? (resumes.get(row.resumeId) ?? null) : null,
    tags: parseTags(row.tags).map(toTag),
    notes: row.notes,
    created_at: added(row),
    updated_at: row.updatedAt ?? added(row),
  };
}

function toPrepNote(row: PrepNoteRow): PrepNote {
  return {
    id: row.id,
    application_id: row.applicationId ?? "",
    stage: row.stage ?? "",
    note: row.note ?? "",
    created_at: added(row),
  };
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    company: row.company ?? "",
    role: row.role,
    link: row.link,
    source: row.source,
    notes: row.notes,
    created_at: added(row),
    updated_at: row.updatedAt ?? added(row),
  };
}

function toResource(row: ResourceRow): ResourceLink {
  return {
    id: row.id,
    label: row.label ?? "",
    url: row.url ?? "",
    notes: row.notes,
    created_at: added(row),
  };
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export const watchedQueries = [
  applicationsQuery,
  prepNotesQuery,
  leadsQuery,
  resourcesQuery,
  resumesQuery,
];

export type HuntlogEvolu = Evolu.Evolu<AppSchema>;

export function createStore(getEvolu: () => Promise<HuntlogEvolu>) {
  function mutate<R>(fn: (evolu: HuntlogEvolu, onComplete: () => void) => R): Promise<R> {
    return getEvolu().then(
      (evolu) =>
        new Promise<R>((resolve) => {
          let result: R;
          result = fn(evolu, () => resolve(result));
        }),
    );
  }

  async function loadResumes(): Promise<Map<string, Resume>> {
    const evolu = await getEvolu();
    const rows = await evolu.loadQuery(resumesQuery);
    return new Map(rows.map((r) => [r.id, toResume(r)]));
  }

  async function loadApplications(): Promise<Application[]> {
    const evolu = await getEvolu();
    const [rows, resumes] = await Promise.all([evolu.loadQuery(applicationsQuery), loadResumes()]);
    return rows
      .map((r) => toApplication(r, resumes))
      .sort(
        (a, b) =>
          b.date_applied.localeCompare(a.date_applied) || b.created_at.localeCompare(a.created_at),
      );
  }

  function softDelete(table: Table, id: string) {
    return mutate((evolu, onComplete) =>
      evolu.update(table, { id, isDeleted: Evolu.sqliteTrue } as never, { onComplete }),
    );
  }

  function applicationFields(data: Partial<ApplicationInput>) {
    const fields: Record<string, unknown> = {};
    const map: Record<string, string> = {
      company: "company",
      role: "role",
      job_link: "jobLink",
      source: "source",
      date_applied: "dateApplied",
      stage: "stage",
      next_action: "nextAction",
      next_action_due: "nextActionDue",
      contact_name: "contactName",
      contact_info: "contactInfo",
      comp_range: "compRange",
      resume_id: "resumeId",
      notes: "notes",
    };
    for (const [from, to] of Object.entries(map)) {
      if (from in data) fields[to] = (data as Record<string, unknown>)[from] ?? null;
    }
    if (data.tagNames) fields.tags = JSON.stringify(normalizeTags(data.tagNames));
    return fields;
  }

  async function getApplication(id: string): Promise<Application> {
    const apps = await loadApplications();
    const app = apps.find((a) => a.id === id);
    if (!app) throw new Error("Application not found");
    return app;
  }

  const store = {
    listApplications: loadApplications,
    getApplication,
    createApplication: async (data: ApplicationInput) => {
      const { id } = await mutate((evolu, onComplete) =>
        evolu.insert(
          "application",
          { addedAt: new Date().toISOString(), ...applicationFields(data) } as never,
          { onComplete },
        ),
      );
      return getApplication(id);
    },
    updateApplication: async (id: string, data: ApplicationUpdate) => {
      await mutate((evolu, onComplete) =>
        evolu.update(
          "application",
          { id: id as ApplicationId, ...applicationFields(data) } as never,
          { onComplete },
        ),
      );
      return getApplication(id);
    },
    deleteApplication: async (id: string) => {
      const evolu = await getEvolu();
      const notes = await evolu.loadQuery(prepNotesQuery);
      await Promise.all(
        notes.filter((n) => n.applicationId === id).map((n) => softDelete("prepNote", n.id)),
      );
      await softDelete("application", id);
    },

    listNotes: async (applicationId: string) => {
      const evolu = await getEvolu();
      const rows = await evolu.loadQuery(prepNotesQuery);
      return rows
        .filter((r) => r.applicationId === applicationId)
        .map(toPrepNote)
        .sort(byNewest((n) => n.created_at));
    },
    addNote: async (applicationId: string, data: PrepNoteInput) => {
      const { id } = await mutate((evolu, onComplete) =>
        evolu.insert(
          "prepNote",
          {
            applicationId: applicationId as ApplicationId,
            stage: data.stage,
            note: data.note,
            addedAt: new Date().toISOString(),
          },
          { onComplete },
        ),
      );
      const notes = await store.listNotes(applicationId);
      return notes.find((n) => n.id === id)!;
    },
    updateNote: async (
      applicationId: string,
      noteId: string,
      data: Partial<Pick<PrepNote, "stage" | "note">>,
    ) => {
      await mutate((evolu, onComplete) =>
        evolu.update("prepNote", { id: noteId as PrepNoteId, ...data }, { onComplete }),
      );
      const notes = await store.listNotes(applicationId);
      return notes.find((n) => n.id === noteId)!;
    },
    deleteNote: async (_applicationId: string, noteId: string) => {
      await softDelete("prepNote", noteId);
    },

    listLeads: async () => {
      const evolu = await getEvolu();
      const rows = await evolu.loadQuery(leadsQuery);
      return rows.map(toLead).sort(byNewest((l) => l.created_at));
    },
    createLead: async (data: LeadInput) => {
      const { id } = await mutate((evolu, onComplete) =>
        evolu.insert(
          "lead",
          {
            company: data.company,
            role: data.role,
            link: data.link,
            source: data.source,
            notes: data.notes,
            addedAt: new Date().toISOString(),
          },
          { onComplete },
        ),
      );
      const leads = await store.listLeads();
      return leads.find((l) => l.id === id)!;
    },
    updateLead: async (id: string, data: LeadUpdate) => {
      await mutate((evolu, onComplete) =>
        evolu.update("lead", { id: id as LeadId, ...data }, { onComplete }),
      );
      const leads = await store.listLeads();
      return leads.find((l) => l.id === id)!;
    },
    deleteLead: async (id: string) => {
      await softDelete("lead", id);
    },
    graduateLead: async (
      id: string,
      overrides?: { source?: string | null; job_link?: string | null; stage?: string },
    ) => {
      const leads = await store.listLeads();
      const lead = leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found");
      const app = await store.createApplication({
        company: lead.company,
        role: lead.role ?? "Unknown role",
        job_link: overrides?.job_link ?? lead.link,
        source: overrides?.source ?? lead.source,
        date_applied: new Date().toISOString().slice(0, 10),
        stage: (overrides?.stage ?? "applied") as Stage,
        next_action: null,
        next_action_due: null,
        contact_name: null,
        contact_info: null,
        comp_range: null,
        resume_id: null,
        notes: lead.notes,
      });
      await softDelete("lead", id);
      return app;
    },

    getStats: async (): Promise<StatsResponse> => {
      const [all, leads] = await Promise.all([loadApplications(), store.listLeads()]);
      const now = Date.now();
      const daysAgo = (n: number) => now - n * 24 * 60 * 60 * 1000;
      const isOpen = (a: Application) => !CLOSED_STAGES.includes(a.stage);
      const responded = all.filter((a) => a.stage !== "applied").length;
      const funnel = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
      for (const a of all) funnel[a.stage] = (funnel[a.stage] ?? 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      return {
        activeApplications: all.filter(isOpen).length,
        appliedLast7Days: all.filter((a) => new Date(a.date_applied).getTime() >= daysAgo(7))
          .length,
        appliedLast30Days: all.filter((a) => new Date(a.date_applied).getTime() >= daysAgo(30))
          .length,
        totalLeads: leads.length,
        responseRate: all.length > 0 ? Math.round((responded / all.length) * 1000) / 10 : 0,
        funnel,
        overdueFollowUps: all.filter(
          (a) => a.next_action_due && a.next_action_due < today && isOpen(a),
        ),
      };
    },

    listTags: async () => {
      const apps = await loadApplications();
      const names = normalizeTags(apps.flatMap((a) => a.tags.map((t) => t.name)));
      return names.sort((a, b) => a.localeCompare(b)).map(toTag);
    },

    listResumes: async () => {
      const resumes = await loadResumes();
      return [...resumes.values()].sort(byNewest((r) => r.uploaded_at));
    },
    getResumeFile: async (id: string) => {
      const evolu = await getEvolu();
      const [row] = await evolu.loadQuery(
        createQuery((db) =>
          db
            .selectFrom("resume")
            .select(["data", "mimeType", "originalFilename"])
            .where("id", "=", id as ResumeId)
            .where("isDeleted", "is not", notDeleted),
        ),
      );
      if (!row?.data) return null;
      return {
        bytes: Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0)),
        mimeType: row.mimeType ?? "application/pdf",
        filename: row.originalFilename ?? "resume.pdf",
      };
    },
    uploadResume: async (
      file: { name: string; type: string; bytes: Uint8Array },
      label?: string,
    ) => {
      const data = base64FromBytes(file.bytes);
      const { id } = await mutate((evolu, onComplete) =>
        evolu.insert(
          "resume",
          {
            label: label?.trim() || file.name,
            originalFilename: file.name,
            mimeType: file.type || "application/pdf",
            data,
            addedAt: new Date().toISOString(),
          },
          { onComplete },
        ),
      );
      const resumes = await loadResumes();
      return resumes.get(id)!;
    },
    deleteResume: async (id: string) => {
      await softDelete("resume", id);
    },

    listResources: async () => {
      const evolu = await getEvolu();
      const rows = await evolu.loadQuery(resourcesQuery);
      return rows.map(toResource).sort(byNewest((r) => r.created_at));
    },
    createResource: async (data: ResourceLinkInput) => {
      const { id } = await mutate((evolu, onComplete) =>
        evolu.insert(
          "resource",
          {
            label: data.label,
            url: data.url,
            notes: data.notes,
            addedAt: new Date().toISOString(),
          },
          { onComplete },
        ),
      );
      const resources = await store.listResources();
      return resources.find((r) => r.id === id)!;
    },
    updateResource: async (id: string, data: ResourceLinkUpdate) => {
      await mutate((evolu, onComplete) =>
        evolu.update("resource", { id: id as ResourceId, ...data }, { onComplete }),
      );
      const resources = await store.listResources();
      return resources.find((r) => r.id === id)!;
    },
    deleteResource: async (id: string) => {
      await softDelete("resource", id);
    },
  };

  return store;
}
