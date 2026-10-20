import * as Evolu from "@evolu/common";
import {
  createEvoluDeps,
  initSharedWorker,
  startDbWorker,
  syncStateToOwnerSyncStatus,
  type CreateDbWorker,
  type DbWorkerInit,
  type OwnerSyncStatus,
  type SharedWorkerInput,
  type SharedWorkerOutput,
} from "@evolu/common/local-first";
import { createBetterSqliteDriver } from "@evolu/nodejs";
import { Schema } from "@huntlog/shared/schema";
import type { HuntlogEvolu } from "@huntlog/shared/store";

const createWorkerRun = () =>
  Evolu.createRun({
    console: Evolu.createConsole({ level: "warn" }),
    consoleStoreOutputEntry: Evolu.createConsoleStoreOutput().entry,
    createBroadcastChannel: Evolu.createBroadcastChannel,
    createMessageChannel: Evolu.createMessageChannel,
    createMessagePort: Evolu.createMessagePort,
    createWebSocket: Evolu.createWebSocket,
    createSqliteDriver: createBetterSqliteDriver,
    getDevicePersistence: () => Promise.resolve("NotPersisted" as const),
    lockManager: navigator.locks,
    randomBytes: Evolu.createRandomBytes(),
  });

const createDbWorker: CreateDbWorker = () =>
  Evolu.createWorker<DbWorkerInit>((self) => {
    void createWorkerRun()(startDbWorker(self));
  });

const sharedWorker = Evolu.createSharedWorker<SharedWorkerInput, SharedWorkerOutput>((self) => {
  void createWorkerRun()(async (run) => {
    await using _ = await run.ok(initSharedWorker(self));
    return await run(Evolu.waitForAbort);
  });
});

export interface Connection {
  readonly evolu: HuntlogEvolu;
  readonly syncStatus: () => OwnerSyncStatus;
  readonly waitForSync: (timeoutMs: number) => Promise<OwnerSyncStatus>;
}

export async function connect(mnemonic: Evolu.Mnemonic, relayUrl: string): Promise<Connection> {
  const deps = createEvoluDeps({
    console: Evolu.createConsole({ level: "warn" }),
    createDbWorker,
    createBroadcastChannel: Evolu.createBroadcastChannel,
    createMessageChannel: Evolu.createMessageChannel,
    lockManager: navigator.locks,
    reloadApp: () => {},
    sharedWorker,
  });
  const run = Evolu.createRun(deps);
  const evolu = await run.ok(
    Evolu.createEvolu(Schema, {
      appName: Evolu.AppName.orThrow("huntlog"),
      appOwner: Evolu.createAppOwner(Evolu.mnemonicToOwnerSecret(mnemonic)),
      transports: [{ type: "WebSocket", url: relayUrl }],
      memoryOnly: true,
    })
  );

  const syncStatus = () =>
    syncStateToOwnerSyncStatus(deps.syncState.get(), evolu.name, evolu.appOwner.id);

  const waitFor = (done: (status: OwnerSyncStatus) => boolean, timeoutMs: number) =>
    new Promise<OwnerSyncStatus>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        unsubscribe();
        resolve(syncStatus());
      };
      const timer = setTimeout(finish, timeoutMs);
      const unsubscribe = deps.syncState.subscribe(() => {
        if (done(syncStatus())) finish();
      });
      if (done(syncStatus())) finish();
    });

  const settled = (status: OwnerSyncStatus) => status.type === "Synced" || status.type === "Error";

  const waitForSync = async (timeoutMs: number) => {
    await waitFor((status) => status.type !== "Synced", 300);
    return waitFor(settled, timeoutMs);
  };

  await waitFor(settled, 20_000);
  return { evolu, syncStatus, waitForSync };
}
