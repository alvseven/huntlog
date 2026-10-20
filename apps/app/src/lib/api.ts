import { createStore, watchedQueries } from "@huntlog/shared/store";
import { getEvolu } from "./evolu";

const { getResumeFile, ...store } = createStore(getEvolu);

async function openResume(id: string): Promise<void> {
  const tab = window.open("", "_blank");
  const file = await getResumeFile(id);
  if (!file) {
    tab?.close();
    return;
  }
  const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mimeType }));
  if (tab) tab.location.href = url;
  else window.open(url, "_blank");
}

async function uploadResume(file: File, label?: string) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return store.uploadResume({ name: file.name, type: file.type, bytes }, label);
}

const changeListeners = new Set<() => void>();
let watching: Promise<void> | null = null;

function startWatching() {
  watching ??= getEvolu().then(async (evolu) => {
    await Promise.all(evolu.loadQueries(watchedQueries));
    for (const query of watchedQueries) {
      evolu.subscribeQuery(query)(() => changeListeners.forEach((listener) => listener()));
    }
  });
}

export function subscribeToChanges(listener: () => void): () => void {
  changeListeners.add(listener);
  startWatching();
  return () => changeListeners.delete(listener);
}

export const api = { ...store, openResume, uploadResume };
