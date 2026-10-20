import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SOURCES, STAGES, type Application, type ApplicationUpdate } from "@huntlog/shared";
import type { createStore } from "@huntlog/shared/store";
import { z } from "zod";
import type { Connection } from "./evolu";

type Store = ReturnType<typeof createStore>;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const stage = z.enum(STAGES);
const source = z.enum(SOURCES);
const optionalText = z.string().nullable().optional();

const applicationFields = {
  job_link: optionalText.describe("URL of the job posting"),
  source: source.nullable().optional().describe("Where the opportunity came from"),
  next_action: optionalText.describe("The next thing to do, e.g. 'Follow up with recruiter'"),
  next_action_due: date.nullable().optional().describe("When the next action is due"),
  contact_name: optionalText,
  contact_info: optionalText.describe("Email, LinkedIn or phone of the contact"),
  comp_range: optionalText.describe("Compensation range, free text"),
  resume_id: optionalText.describe("Id of the resume version sent, from list_resumes"),
  notes: optionalText,
  tags: z.array(z.string()).optional().describe("Replaces all tags on the application"),
};

const leadFields = {
  role: optionalText,
  link: optionalText,
  source: source.nullable().optional(),
  notes: optionalText,
};

const today = () => new Date().toISOString().slice(0, 10);
const normalize = (value: string) => value.trim().toLowerCase();

const summarize = (app: Application) => ({
  id: app.id,
  company: app.company,
  role: app.role,
  stage: app.stage,
  date_applied: app.date_applied,
  source: app.source,
  job_link: app.job_link,
  next_action: app.next_action,
  next_action_due: app.next_action_due,
  tags: app.tags.map((t) => t.name),
});

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function registerTools(
  server: McpServer,
  ready: Promise<{ store: Store; connection: Connection }>
) {
  const synced = async (connection: Connection) => {
    const status = await connection.waitForSync(15_000);
    if (status.type === "Synced") return { synced: true };
    return {
      synced: false,
      warning: `Saved, but the relay hasn't confirmed it yet (${status.type}). Keep this server running until it syncs.`,
    };
  };

  const read = { readOnlyHint: true, openWorldHint: false };
  const write = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  const remove = { readOnlyHint: false, destructiveHint: true, openWorldHint: false };

  server.registerTool(
    "get_overview",
    {
      title: "Job search overview",
      description:
        "Stats for the whole search: active applications, applications in the last 7 and 30 days, response rate, the stage funnel, overdue follow-ups and every tag in use. Start here to understand where the search stands.",
      annotations: read,
    },
    async () => {
      const { store, connection } = await ready;
      const [stats, tags] = await Promise.all([store.getStats(), store.listTags()]);
      return json({
        ...stats,
        overdueFollowUps: stats.overdueFollowUps.map(summarize),
        tags: tags.map((t) => t.name),
        sync: connection.syncStatus().type,
      });
    }
  );

  server.registerTool(
    "list_applications",
    {
      title: "List applications",
      description:
        "Lists job applications, newest first. Filter by stage, or search company, role, notes and tags.",
      inputSchema: {
        stage: stage.optional(),
        search: z.string().optional().describe("Case-insensitive text to look for"),
        limit: z.number().int().min(1).max(500).optional().describe("Defaults to 100"),
      },
      annotations: read,
    },
    async ({ stage, search, limit }) => {
      const { store } = await ready;
      const needle = search ? normalize(search) : null;
      const apps = (await store.listApplications()).filter(
        (a) =>
          (!stage || a.stage === stage) &&
          (!needle ||
            [a.company, a.role, a.notes ?? "", ...a.tags.map((t) => t.name)].some((field) =>
              normalize(field).includes(needle)
            ))
      );
      return json({ total: apps.length, applications: apps.slice(0, limit ?? 100).map(summarize) });
    }
  );

  server.registerTool(
    "get_application",
    {
      title: "Get application",
      description: "Every field of one application, plus its interview prep notes.",
      inputSchema: { id: z.string() },
      annotations: read,
    },
    async ({ id }) => {
      const { store } = await ready;
      const app = (await store.listApplications()).find((a) => a.id === id);
      if (!app) return fail(`No application with id ${id}.`);
      return json({ ...app, prep_notes: await store.listNotes(id) });
    }
  );

  server.registerTool(
    "create_application",
    {
      title: "Add application",
      description:
        "Records a job you applied to. Returns possible duplicates (same company and role) so you can avoid adding the same job twice.",
      inputSchema: {
        company: z.string().min(1),
        role: z.string().min(1),
        date_applied: date.optional().describe("Defaults to today"),
        stage: stage.optional().describe("Defaults to applied"),
        ...applicationFields,
      },
      annotations: write,
    },
    async ({ tags, ...input }) => {
      const { store, connection } = await ready;
      const existing = await store.listApplications();
      const duplicates = existing.filter(
        (a) =>
          normalize(a.company) === normalize(input.company) &&
          normalize(a.role) === normalize(input.role)
      );
      const app = await store.createApplication({
        company: input.company,
        role: input.role,
        date_applied: input.date_applied ?? today(),
        stage: input.stage ?? "applied",
        job_link: input.job_link ?? null,
        source: input.source ?? null,
        next_action: input.next_action ?? null,
        next_action_due: input.next_action_due ?? null,
        contact_name: input.contact_name ?? null,
        contact_info: input.contact_info ?? null,
        comp_range: input.comp_range ?? null,
        resume_id: input.resume_id ?? null,
        notes: input.notes ?? null,
        tagNames: tags,
      });
      return json({
        application: app,
        possible_duplicates: duplicates.map(summarize),
        ...(await synced(connection)),
      });
    }
  );

  server.registerTool(
    "update_application",
    {
      title: "Update application",
      description:
        "Changes fields on an application, such as moving it to another stage or setting the next action. Only the fields you pass change; pass null to clear one.",
      inputSchema: {
        id: z.string(),
        company: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        date_applied: date.optional(),
        stage: stage.optional(),
        ...applicationFields,
      },
      annotations: write,
    },
    async ({ id, tags, ...fields }) => {
      const { store, connection } = await ready;
      if (!(await store.listApplications()).some((a) => a.id === id))
        return fail(`No application with id ${id}.`);
      const update: ApplicationUpdate = { ...withoutUndefined(fields), tagNames: tags };
      const app = await store.updateApplication(id, update);
      return json({ application: app, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "delete_application",
    {
      title: "Delete application",
      description:
        "Deletes an application and its prep notes from every device that syncs this search.",
      inputSchema: { id: z.string() },
      annotations: remove,
    },
    async ({ id }) => {
      const { store, connection } = await ready;
      const app = (await store.listApplications()).find((a) => a.id === id);
      if (!app) return fail(`No application with id ${id}.`);
      await store.deleteApplication(id);
      return json({ deleted: summarize(app), ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "add_prep_note",
    {
      title: "Add interview prep note",
      description: "Adds a note to an application, e.g. what was asked in an interview.",
      inputSchema: {
        application_id: z.string(),
        note: z.string().min(1),
        stage: stage.optional().describe("Defaults to the application's current stage"),
      },
      annotations: write,
    },
    async ({ application_id, note, stage }) => {
      const { store, connection } = await ready;
      const app = (await store.listApplications()).find((a) => a.id === application_id);
      if (!app) return fail(`No application with id ${application_id}.`);
      const added = await store.addNote(application_id, {
        application_id,
        note,
        stage: stage ?? app.stage,
      });
      return json({ note: added, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "update_prep_note",
    {
      title: "Update interview prep note",
      description: "Edits the text or stage of a prep note.",
      inputSchema: {
        application_id: z.string(),
        note_id: z.string(),
        note: z.string().min(1).optional(),
        stage: stage.optional(),
      },
      annotations: write,
    },
    async ({ application_id, note_id, ...fields }) => {
      const { store, connection } = await ready;
      if (!(await store.listNotes(application_id)).some((n) => n.id === note_id))
        return fail(`No note ${note_id} on application ${application_id}.`);
      const note = await store.updateNote(application_id, note_id, withoutUndefined(fields));
      return json({ note, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "delete_prep_note",
    {
      title: "Delete interview prep note",
      description: "Deletes one prep note.",
      inputSchema: { application_id: z.string(), note_id: z.string() },
      annotations: remove,
    },
    async ({ application_id, note_id }) => {
      const { store, connection } = await ready;
      if (!(await store.listNotes(application_id)).some((n) => n.id === note_id))
        return fail(`No note ${note_id} on application ${application_id}.`);
      await store.deleteNote(application_id, note_id);
      return json({ deleted: note_id, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "list_leads",
    {
      title: "List leads",
      description: "Lists leads: companies or roles to apply to later. Optionally search them.",
      inputSchema: { search: z.string().optional() },
      annotations: read,
    },
    async ({ search }) => {
      const { store } = await ready;
      const needle = search ? normalize(search) : null;
      const leads = (await store.listLeads()).filter(
        (l) =>
          !needle ||
          [l.company, l.role ?? "", l.notes ?? ""].some((f) => normalize(f).includes(needle))
      );
      return json({ total: leads.length, leads });
    }
  );

  server.registerTool(
    "create_lead",
    {
      title: "Add lead",
      description: "Saves a company or role to apply to later.",
      inputSchema: { company: z.string().min(1), ...leadFields },
      annotations: write,
    },
    async ({ company, ...fields }) => {
      const { store, connection } = await ready;
      const lead = await store.createLead({
        company,
        role: fields.role ?? null,
        link: fields.link ?? null,
        source: fields.source ?? null,
        notes: fields.notes ?? null,
      });
      return json({ lead, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "update_lead",
    {
      title: "Update lead",
      description: "Changes fields on a lead. Only the fields you pass change; pass null to clear one.",
      inputSchema: { id: z.string(), company: z.string().min(1).optional(), ...leadFields },
      annotations: write,
    },
    async ({ id, ...fields }) => {
      const { store, connection } = await ready;
      if (!(await store.listLeads()).some((l) => l.id === id)) return fail(`No lead with id ${id}.`);
      const lead = await store.updateLead(id, withoutUndefined(fields));
      return json({ lead, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "delete_lead",
    {
      title: "Delete lead",
      description: "Deletes a lead.",
      inputSchema: { id: z.string() },
      annotations: remove,
    },
    async ({ id }) => {
      const { store, connection } = await ready;
      const lead = (await store.listLeads()).find((l) => l.id === id);
      if (!lead) return fail(`No lead with id ${id}.`);
      await store.deleteLead(id);
      return json({ deleted: lead, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "convert_lead_to_application",
    {
      title: "Apply to a lead",
      description:
        "Turns a lead into an application dated today and removes the lead, the same as Applied in the app.",
      inputSchema: {
        id: z.string(),
        stage: stage.optional(),
        source: source.nullable().optional(),
        job_link: optionalText,
      },
      annotations: write,
    },
    async ({ id, ...overrides }) => {
      const { store, connection } = await ready;
      if (!(await store.listLeads()).some((l) => l.id === id)) return fail(`No lead with id ${id}.`);
      const application = await store.graduateLead(id, withoutUndefined(overrides));
      return json({ application, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "list_resources",
    {
      title: "List resources",
      description: "Lists saved links, such as prep guides, salary data or job boards.",
      annotations: read,
    },
    async () => {
      const { store } = await ready;
      return json({ resources: await store.listResources() });
    }
  );

  server.registerTool(
    "create_resource",
    {
      title: "Add resource",
      description: "Saves a useful link.",
      inputSchema: { label: z.string().min(1), url: z.string().min(1), notes: optionalText },
      annotations: write,
    },
    async ({ label, url, notes }) => {
      const { store, connection } = await ready;
      const resource = await store.createResource({ label, url, notes: notes ?? null });
      return json({ resource, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "update_resource",
    {
      title: "Update resource",
      description: "Changes a saved link. Only the fields you pass change.",
      inputSchema: {
        id: z.string(),
        label: z.string().min(1).optional(),
        url: z.string().min(1).optional(),
        notes: optionalText,
      },
      annotations: write,
    },
    async ({ id, ...fields }) => {
      const { store, connection } = await ready;
      if (!(await store.listResources()).some((r) => r.id === id))
        return fail(`No resource with id ${id}.`);
      const resource = await store.updateResource(id, withoutUndefined(fields));
      return json({ resource, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "delete_resource",
    {
      title: "Delete resource",
      description: "Deletes a saved link.",
      inputSchema: { id: z.string() },
      annotations: remove,
    },
    async ({ id }) => {
      const { store, connection } = await ready;
      const resource = (await store.listResources()).find((r) => r.id === id);
      if (!resource) return fail(`No resource with id ${id}.`);
      await store.deleteResource(id);
      return json({ deleted: resource, ...(await synced(connection)) });
    }
  );

  server.registerTool(
    "list_resumes",
    {
      title: "List resumes",
      description:
        "Lists uploaded resume versions. Use a resume's id as resume_id on an application.",
      annotations: read,
    },
    async () => {
      const { store } = await ready;
      return json({ resumes: await store.listResumes() });
    }
  );

  server.registerTool(
    "delete_resume",
    {
      title: "Delete resume",
      description: "Deletes an uploaded resume version.",
      inputSchema: { id: z.string() },
      annotations: remove,
    },
    async ({ id }) => {
      const { store, connection } = await ready;
      const resume = (await store.listResumes()).find((r) => r.id === id);
      if (!resume) return fail(`No resume with id ${id}.`);
      await store.deleteResume(id);
      return json({ deleted: resume, ...(await synced(connection)) });
    }
  );
}
