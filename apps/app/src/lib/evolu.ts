import * as Evolu from "@evolu/common";
import { createEvoluDeps } from "@evolu/react-web";
import { createRun } from "@evolu/web";

const Text = Evolu.nullOr(Evolu.String);

export const ApplicationId = Evolu.id("Application");
export type ApplicationId = typeof ApplicationId.Output;
export const PrepNoteId = Evolu.id("PrepNote");
export type PrepNoteId = typeof PrepNoteId.Output;
export const LeadId = Evolu.id("Lead");
export type LeadId = typeof LeadId.Output;
export const ResourceId = Evolu.id("Resource");
export type ResourceId = typeof ResourceId.Output;
export const ResumeId = Evolu.id("Resume");
export type ResumeId = typeof ResumeId.Output;

export const Schema = {
  application: {
    id: ApplicationId,
    company: Evolu.String,
    role: Evolu.String,
    jobLink: Text,
    source: Text,
    dateApplied: Evolu.String,
    stage: Evolu.String,
    nextAction: Text,
    nextActionDue: Text,
    contactName: Text,
    contactInfo: Text,
    compRange: Text,
    resumeId: Evolu.nullOr(ResumeId),
    notes: Text,
    tags: Text,
    addedAt: Text,
  },
  prepNote: {
    id: PrepNoteId,
    applicationId: ApplicationId,
    stage: Evolu.String,
    note: Evolu.String,
    addedAt: Text,
  },
  lead: {
    id: LeadId,
    company: Evolu.String,
    role: Text,
    link: Text,
    source: Text,
    notes: Text,
    addedAt: Text,
  },
  resource: {
    id: ResourceId,
    label: Evolu.String,
    url: Evolu.String,
    notes: Text,
    addedAt: Text,
  },
  resume: {
    id: ResumeId,
    label: Evolu.String,
    originalFilename: Evolu.String,
    mimeType: Evolu.String,
    data: Evolu.String,
    addedAt: Text,
  },
};

export type AppSchema = typeof Schema;

export const createQuery = Evolu.createQueryBuilder(Schema);

const MNEMONIC_KEY = "huntlog:mnemonic";

export function getStoredMnemonic(): Evolu.Mnemonic | null {
  try {
    const value = localStorage.getItem(MNEMONIC_KEY);
    if (!value) return null;
    const result = Evolu.Mnemonic.fromUnknown(value);
    return result.ok ? result.value : null;
  } catch {
    return null;
  }
}

export function createNewIdentity(): void {
  const secret = Evolu.createOwnerSecret({ randomBytes: Evolu.createRandomBytes() });
  localStorage.setItem(MNEMONIC_KEY, Evolu.ownerSecretToMnemonic(secret));
}

export function restoreIdentity(input: string): string | null {
  const result = Evolu.Mnemonic.fromUnknown(input.trim().replace(/\s+/g, " "));
  if (!result.ok) return Evolu.Mnemonic.formatError(result.error);
  localStorage.setItem(MNEMONIC_KEY, result.value);
  return null;
}

export function forgetIdentity(): void {
  localStorage.removeItem(MNEMONIC_KEY);
}

const relayUrl: string | undefined =
  import.meta.env.VITE_RELAY_URL ?? (import.meta.env.DEV ? "ws://localhost:4000" : undefined);

export const run = createRun(createEvoluDeps());

let evoluPromise: Promise<Evolu.Evolu<AppSchema>> | null = null;

export function getEvolu(): Promise<Evolu.Evolu<AppSchema>> {
  if (evoluPromise) return evoluPromise;
  const mnemonic = getStoredMnemonic();
  if (!mnemonic) throw new Error("No identity on this device");
  evoluPromise = run.ok(
    Evolu.createEvolu(Schema, {
      appName: Evolu.AppName.orThrow("huntlog"),
      appOwner: Evolu.createAppOwner(Evolu.mnemonicToOwnerSecret(mnemonic)),
      ...(relayUrl && { transports: [{ type: "WebSocket", url: relayUrl }] }),
    })
  );
  return evoluPromise;
}
