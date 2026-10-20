import { useEffect, useState } from "react";
import { useApi } from "./api-context";

export function useDataVersion(): number {
  const { subscribe } = useApi();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setVersion((v) => v + 1), 50);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [subscribe]);
  return version;
}
