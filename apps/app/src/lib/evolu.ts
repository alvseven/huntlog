import * as Evolu from "@evolu/common";
import { createEvoluDeps } from "@evolu/react-web";
import { createRun } from "@evolu/web";
import { Schema, type AppSchema } from "@huntlog/shared/schema";

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
