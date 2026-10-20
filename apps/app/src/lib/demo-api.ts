import {
  CLOSED_STAGES,
  STAGES,
  type Application,
  type ApplicationInput,
  type ApplicationUpdate,
  type Lead,
  type PrepNote,
  type Resume,
  type ResourceLink,
  type Stage,
  type StatsResponse,
  type Tag,
} from "@huntlog/shared";
import type { Api } from "./api-context";

const DAY_MS = 86_400_000;
const day = (offset: number) => new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);
const stamp = (offset: number) => new Date(Date.now() + offset * DAY_MS).toISOString();
const toTag = (name: string): Tag => ({ id: name.toLowerCase(), name });

const RESUMES: Resume[] = [
  {
    id: "r1",
    label: "Backend, fintech focus",
    original_filename: "resume-backend.pdf",
    uploaded_at: stamp(-20),
  },
  {
    id: "r2",
    label: "Full-stack, AI focus",
    original_filename: "resume-fullstack.pdf",
    uploaded_at: stamp(-18),
  },
  { id: "r3", label: "General", original_filename: "resume-general.pdf", uploaded_at: stamp(-30) },
];

type Seed = [
  string,
  string,
  Stage,
  number,
  string | null,
  number | null,
  string[],
  string | null,
  string | null,
];

const SEED: Seed[] = [
  [
    "Parallel",
    "Software Engineer, Billing",
    "offer",
    -17,
    "Reply to the offer",
    3,
    ["fintech"],
    "r1",
    "Offer call went well. Asked for the written offer and equity details.",
  ],
  [
    "Northwind Pay",
    "Backend Engineer",
    "technical_interview",
    -13,
    "System design round",
    2,
    ["fintech", "referral"],
    "r1",
    "Referred by a former teammate.",
  ],
  [
    "Lumen Labs",
    "Full-stack Engineer",
    "recruiter_screen",
    -10,
    "Send availability",
    -1,
    ["ai"],
    "r2",
    null,
  ],
  [
    "Kite Health",
    "Product Engineer",
    "recruiter_screen",
    -9,
    "Prepare questions for the screen",
    1,
    [],
    "r3",
    null,
  ],
  [
    "Orbit AI",
    "Platform Engineer",
    "applied",
    -5,
    "Email the hiring manager",
    -3,
    ["ai", "cold"],
    "r2",
    null,
  ],
  ["Tessera", "Software Engineer", "applied", -2, "Follow up", 5, [], "r3", null],
  ["Brightwave", "Full-stack Engineer", "applied", -3, null, null, ["ai"], "r2", null],
  ["Quarry", "Backend Engineer", "applied", -4, "Ask a friend for a referral", 0, [], "r1", null],
  ["Helix Data", "Platform Engineer", "applied", -6, null, null, [], "r1", null],
  ["Meridian", "Software Engineer, Payments", "applied", -8, null, null, ["fintech"], "r1", null],
  ["Stellar Labs", "Backend Engineer", "applied", -11, null, null, [], "r3", null],
  ["Cobalt", "Product Engineer", "applied", -15, null, null, [], "r3", null],
  ["Fathom", "Backend Engineer", "rejected", -21, null, null, [], "r1", null],
  ["Copperline", "Senior Backend Engineer", "rejected", -25, null, null, ["fintech"], "r1", null],
];

function seedApplications(): Application[] {
  return SEED.map(([company, role, stage, applied, next, due, tags, resumeId, notes], i) => ({
    id: `a${i + 1}`,
    company,
    role,
    job_link: null,
    source: i % 3 === 0 ? "referral" : i % 3 === 1 ? "linkedin" : "job_board",
    date_applied: day(applied),
    stage,
    next_action: next,
    next_action_due: due === null ? null : day(due),
    contact_name: null,
    contact_info: null,
    comp_range: null,
    resume_id: resumeId,
    resume: RESUMES.find((r) => r.id === resumeId) ?? null,
    tags: tags.map(toTag),
    notes,
    created_at: stamp(applied),
    updated_at: stamp(applied),
  }));
}

function seedNotes(): PrepNote[] {
  return [
    {
      id: "n1",
      application_id: "a2",
      stage: "technical_interview",
      note: "Next: system design with two senior engineers. Review idempotency keys, retries and webhook delivery.",
      created_at: stamp(-1),
    },
    {
      id: "n2",
      application_id: "a2",
      stage: "recruiter_screen",
      note: "Team of 6, owns payouts. Range confirmed. They liked the billing migration story.",
      created_at: stamp(-9),
    },
    {
      id: "n3",
      application_id: "a3",
      stage: "recruiter_screen",
      note: "Screen is 30 minutes with the recruiter. Mention the AI agent pipeline work.",
      created_at: stamp(-2),
    },
  ];
}

function seedLeads(): Lead[] {
  return [
    ["Mosaic", "Product Engineer", "https://example.com/mosaic", "referral", "Friend works there."],
    ["Harbor", "Software Engineer, Infra", null, "job_board", null],
    ["Quanta", "Full-stack Engineer", null, "x_twitter", "Founder posted a hiring thread."],
    ["Lattice Pay", "Senior Backend Engineer", null, "linkedin", null],
    ["Northstar", "Platform Engineer", null, "warm_intro", "Intro pending."],
    ["Juniper", "Backend Engineer", null, "company_website", null],
  ].map(([company, role, link, source, notes], i) => ({
    id: `l${i + 1}`,
    company: company!,
    role,
    link,
    source,
    notes,
    created_at: stamp(-i - 1),
    updated_at: stamp(-i - 1),
  }));
}

function seedResources(): ResourceLink[] {
  return [
    ["Work at a Startup", "https://www.workatastartup.com", "YC's job board for its companies."],
    [
      "Hacker News: Who is hiring?",
      "https://news.ycombinator.com/submitted?id=whoishiring",
      "Monthly hiring thread.",
    ],
    ["Wellfound", "https://wellfound.com", "Startup roles, many remote."],
    ["Levels.fyi", "https://www.levels.fyi", "Compensation data before negotiating."],
  ].map(([label, url, notes], i) => ({
    id: `s${i + 1}`,
    label,
    url,
    notes,
    created_at: stamp(-i - 3),
  }));
}

export function createDemoApi(): Api {
  let applications = seedApplications();
  let notes = seedNotes();
  let leads = seedLeads();
  let resources = seedResources();
  let resumes = [...RESUMES];
  let counter = 100;
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((l) => l());
  const nextId = (prefix: string) => `${prefix}${counter++}`;
  const resolve = <T>(value: T) => Promise.resolve(structuredClone(value));

  const withResume = (a: Application): Application => ({
    ...a,
    resume: resumes.find((r) => r.id === a.resume_id) ?? null,
  });

  const applyUpdate = (app: Application, data: ApplicationUpdate): Application => {
    const { tagNames, ...fields } = data;
    return withResume({
      ...app,
      ...fields,
      tags: tagNames ? tagNames.map(toTag) : app.tags,
      updated_at: new Date().toISOString(),
    });
  };

  const sorted = () =>
    [...applications].sort(
      (a, b) =>
        b.date_applied.localeCompare(a.date_applied) || b.created_at.localeCompare(a.created_at)
    );

  const api: Api = {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listApplications: () => resolve(sorted()),
    getApplication: (id) => {
      const app = applications.find((a) => a.id === id);
      return app ? resolve(app) : Promise.reject(new Error("Application not found"));
    },
    createApplication: (data: ApplicationInput) => {
      const { tagNames, ...fields } = data;
      const now = new Date().toISOString();
      const app = withResume({
        ...fields,
        id: nextId("a"),
        resume: null,
        tags: (tagNames ?? []).map(toTag),
        created_at: now,
        updated_at: now,
      });
      applications = [app, ...applications];
      changed();
      return resolve(app);
    },
    updateApplication: (id, data) => {
      applications = applications.map((a) => (a.id === id ? applyUpdate(a, data) : a));
      changed();
      return api.getApplication(id);
    },
    deleteApplication: (id) => {
      applications = applications.filter((a) => a.id !== id);
      notes = notes.filter((n) => n.application_id !== id);
      changed();
      return Promise.resolve();
    },
    listNotes: (applicationId) =>
      resolve(
        notes
          .filter((n) => n.application_id === applicationId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
      ),
    addNote: (applicationId, data) => {
      const note: PrepNote = {
        id: nextId("n"),
        application_id: applicationId,
        stage: data.stage,
        note: data.note,
        created_at: new Date().toISOString(),
      };
      notes = [note, ...notes];
      changed();
      return resolve(note);
    },
    updateNote: (_applicationId, noteId, data) => {
      notes = notes.map((n) => (n.id === noteId ? { ...n, ...data } : n));
      changed();
      return resolve(notes.find((n) => n.id === noteId)!);
    },
    deleteNote: (_applicationId, noteId) => {
      notes = notes.filter((n) => n.id !== noteId);
      changed();
      return Promise.resolve();
    },
    listLeads: () => resolve(leads),
    createLead: (data) => {
      const now = new Date().toISOString();
      const lead: Lead = { ...data, id: nextId("l"), created_at: now, updated_at: now };
      leads = [lead, ...leads];
      changed();
      return resolve(lead);
    },
    updateLead: (id, data) => {
      leads = leads.map((l) =>
        l.id === id ? { ...l, ...data, updated_at: new Date().toISOString() } : l
      );
      changed();
      return resolve(leads.find((l) => l.id === id)!);
    },
    deleteLead: (id) => {
      leads = leads.filter((l) => l.id !== id);
      changed();
      return Promise.resolve();
    },
    graduateLead: async (id, overrides) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found");
      leads = leads.filter((l) => l.id !== id);
      return api.createApplication({
        company: lead.company,
        role: lead.role ?? "Unknown role",
        job_link: overrides?.job_link ?? lead.link,
        source: overrides?.source ?? lead.source,
        date_applied: day(0),
        stage: (overrides?.stage ?? "applied") as Stage,
        next_action: null,
        next_action_due: null,
        contact_name: null,
        contact_info: null,
        comp_range: null,
        resume_id: null,
        notes: lead.notes,
      });
    },
    getStats: () => {
      const now = Date.now();
      const isOpen = (a: Application) => !CLOSED_STAGES.includes(a.stage);
      const responded = applications.filter((a) => a.stage !== "applied").length;
      const funnel = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
      for (const a of applications) funnel[a.stage] += 1;
      const today = day(0);
      const stats: StatsResponse = {
        activeApplications: applications.filter(isOpen).length,
        appliedLast7Days: applications.filter(
          (a) => new Date(a.date_applied).getTime() >= now - 7 * DAY_MS
        ).length,
        appliedLast30Days: applications.filter(
          (a) => new Date(a.date_applied).getTime() >= now - 30 * DAY_MS
        ).length,
        totalLeads: leads.length,
        responseRate: applications.length
          ? Math.round((responded / applications.length) * 1000) / 10
          : 0,
        funnel,
        overdueFollowUps: applications.filter(
          (a) => a.next_action_due && a.next_action_due < today && isOpen(a)
        ),
      };
      return resolve(stats);
    },
    listTags: () => {
      const names = new Map<string, string>();
      for (const a of applications) for (const t of a.tags) names.set(t.id, t.name);
      return resolve([...names.values()].sort((a, b) => a.localeCompare(b)).map(toTag));
    },
    listResumes: () => resolve(resumes),
    uploadResume: (file, label) => {
      const resume: Resume = {
        id: nextId("r"),
        label: label?.trim() || file.name,
        original_filename: file.name,
        uploaded_at: new Date().toISOString(),
      };
      resumes = [resume, ...resumes];
      changed();
      return resolve(resume);
    },
    deleteResume: (id) => {
      resumes = resumes.filter((r) => r.id !== id);
      changed();
      return Promise.resolve();
    },
    openResume: () => Promise.resolve(),
    listResources: () => resolve(resources),
    createResource: (data) => {
      const resource: ResourceLink = {
        ...data,
        id: nextId("s"),
        created_at: new Date().toISOString(),
      };
      resources = [resource, ...resources];
      changed();
      return resolve(resource);
    },
    updateResource: (id, data) => {
      resources = resources.map((r) => (r.id === id ? { ...r, ...data } : r));
      changed();
      return resolve(resources.find((r) => r.id === id)!);
    },
    deleteResource: (id) => {
      resources = resources.filter((r) => r.id !== id);
      changed();
      return Promise.resolve();
    },
  };
  return api;
}
