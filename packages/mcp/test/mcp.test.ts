import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import * as Evolu from "@evolu/common";
import { createRelay, createRelayDeps } from "@evolu/nodejs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const server = join(import.meta.dirname, "..", "dist", "index.js");
const phrase = Evolu.ownerSecretToMnemonic(
  Evolu.createOwnerSecret({ randomBytes: Evolu.createRandomBytes() })
);

let relay: AsyncDisposable & { port: number };
let relayUrl: string;
const clients: Client[] = [];

async function connectClient(env: Record<string, string> = {}) {
  const client = new Client({ name: "huntlog-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [server],
      env: { PATH: process.env.PATH ?? "", HUNTLOG_RECOVERY_PHRASE: phrase, HUNTLOG_RELAY_URL: relayUrl, ...env },
      stderr: "ignore",
    })
  );
  clients.push(client);
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as { type: string; text: string }[])[0]?.text ?? "";
  if (result.isError) return { error: text };
  return JSON.parse(text);
}

before(async () => {
  process.chdir(mkdtempSync(join(tmpdir(), "huntlog-mcp-test-")));
  const run = Evolu.createRun(createRelayDeps());
  relay = await run.ok(createRelay({ port: Evolu.Port.orThrow(0), isOwnerWithinQuota: () => true }));
  relayUrl = `ws://localhost:${relay.port}`;
});

after(async () => {
  await Promise.all(clients.map((c) => c.close()));
  await relay[Symbol.asyncDispose]();
});

let a: Client;
let appId: string;

test("lists every tool, with delete tools marked destructive", async () => {
  a = await connectClient();
  const { tools } = await a.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "add_prep_note",
    "convert_lead_to_application",
    "create_application",
    "create_lead",
    "create_resource",
    "delete_application",
    "delete_lead",
    "delete_prep_note",
    "delete_resource",
    "delete_resume",
    "get_application",
    "get_overview",
    "list_applications",
    "list_leads",
    "list_resources",
    "list_resumes",
    "update_application",
    "update_lead",
    "update_prep_note",
    "update_resource",
  ]);
  for (const tool of tools) {
    assert.equal(tool.annotations?.destructiveHint === true, tool.name.startsWith("delete_"), tool.name);
    assert.equal(tool.annotations?.readOnlyHint === true, /^(get|list)_/.test(tool.name), tool.name);
  }
});

test("creates an application with defaults and syncs it", async () => {
  const result = await call(a, "create_application", {
    company: "Acme",
    role: "Senior Engineer",
    source: "linkedin",
    tags: ["remote", "Remote", " usd "],
  });
  assert.equal(result.synced, true);
  assert.equal(result.application.stage, "applied");
  assert.equal(result.application.date_applied, new Date().toISOString().slice(0, 10));
  assert.deepEqual(result.application.tags.map((t: { name: string }) => t.name), ["remote", "usd"]);
  assert.deepEqual(result.possible_duplicates, []);
  appId = result.application.id;
});

test("flags a possible duplicate", async () => {
  const result = await call(a, "create_application", { company: "acme ", role: "senior engineer" });
  assert.equal(result.possible_duplicates.length, 1);
  assert.equal(result.possible_duplicates[0].id, appId);
  await call(a, "delete_application", { id: result.application.id });
});

test("rejects invalid input", async () => {
  const badStage = await call(a, "create_application", { company: "X", role: "Y", stage: "hired" });
  assert.ok(badStage.error);
  const badDate = await call(a, "create_application", { company: "X", role: "Y", date_applied: "May 3" });
  assert.ok(badDate.error);
  const missing = await call(a, "update_application", { id: "nope", stage: "offer" });
  assert.match(missing.error, /No application/);
  const { total } = await call(a, "list_applications", { search: "x" });
  assert.equal(total, 0);
});

test("updates only the fields passed, and clears with null", async () => {
  await call(a, "update_application", { id: appId, next_action: "Follow up", comp_range: "120k" });
  const result = await call(a, "update_application", {
    id: appId,
    stage: "recruiter_screen",
    comp_range: null,
  });
  assert.equal(result.synced, true);
  assert.equal(result.application.stage, "recruiter_screen");
  assert.equal(result.application.next_action, "Follow up");
  assert.equal(result.application.comp_range, null);
  assert.equal(result.application.company, "Acme");
});

test("manages prep notes", async () => {
  const added = await call(a, "add_prep_note", { application_id: appId, note: "Asked about Kafka" });
  assert.equal(added.note.stage, "recruiter_screen");
  const updated = await call(a, "update_prep_note", {
    application_id: appId,
    note_id: added.note.id,
    note: "Asked about Kafka and Postgres",
  });
  assert.equal(updated.note.note, "Asked about Kafka and Postgres");
  const detail = await call(a, "get_application", { id: appId });
  assert.equal(detail.prep_notes.length, 1);
  await call(a, "delete_prep_note", { application_id: appId, note_id: added.note.id });
  assert.equal((await call(a, "get_application", { id: appId })).prep_notes.length, 0);
});

test("converts a lead into an application", async () => {
  const { lead } = await call(a, "create_lead", { company: "Globex", role: "Staff Engineer" });
  await call(a, "update_lead", { id: lead.id, notes: "Referral from Ana" });
  assert.equal((await call(a, "list_leads", { search: "globex" })).total, 1);
  const { application } = await call(a, "convert_lead_to_application", {
    id: lead.id,
    source: "referral",
  });
  assert.equal(application.company, "Globex");
  assert.equal(application.notes, "Referral from Ana");
  assert.equal(application.source, "referral");
  assert.equal((await call(a, "list_leads")).total, 0);
});

test("manages resources", async () => {
  const { resource } = await call(a, "create_resource", { label: "Levels", url: "https://levels.fyi" });
  await call(a, "update_resource", { id: resource.id, notes: "Salary data" });
  const { resources } = await call(a, "list_resources");
  assert.equal(resources[0].notes, "Salary data");
  await call(a, "delete_resource", { id: resource.id });
  assert.equal((await call(a, "list_resources")).resources.length, 0);
});

test("overview reflects the data", async () => {
  const overview = await call(a, "get_overview");
  assert.equal(overview.activeApplications, 2);
  assert.equal(overview.funnel.recruiter_screen, 1);
  assert.equal(overview.funnel.applied, 1);
  assert.deepEqual(overview.tags, ["remote", "usd"]);
  assert.equal(overview.sync, "Synced");
});

test("a second device with the same phrase sees everything through the relay", async () => {
  const b = await connectClient();
  const { applications } = await call(b, "list_applications");
  assert.deepEqual(applications.map((x: { company: string }) => x.company).sort(), ["Acme", "Globex"]);
  const globex = applications.find((x: { company: string }) => x.company === "Globex");
  await call(b, "delete_application", { id: globex.id });

  let companies: string[] = [];
  for (let i = 0; i < 40; i++) {
    companies = (await call(a, "list_applications")).applications.map((x: { company: string }) => x.company);
    if (companies.length === 1) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.deepEqual(companies, ["Acme"]);
});

test("a different phrase sees none of it", async () => {
  const other = Evolu.ownerSecretToMnemonic(
    Evolu.createOwnerSecret({ randomBytes: Evolu.createRandomBytes() })
  );
  const c = await connectClient({ HUNTLOG_RECOVERY_PHRASE: other });
  assert.equal((await call(c, "list_applications")).total, 0);
});
