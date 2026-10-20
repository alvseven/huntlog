import { createContext, useContext, type ReactNode } from "react";
import { api, subscribeToChanges } from "./api";

export type Api = typeof api & { subscribe: (listener: () => void) => () => void };

const defaultApi: Api = { ...api, subscribe: subscribeToChanges };

const ApiContext = createContext<Api>(defaultApi);

export function ApiProvider({ value, children }: { value: Api; children: ReactNode }) {
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): Api {
  return useContext(ApiContext);
}
