import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiProvider } from "@/lib/api-context";
import { createDemoApi } from "@/lib/demo-api";

const APP_WIDTH = 1180;

export function LiveDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setZoom(width >= 768 ? Math.min(1, width / APP_WIDTH) : 0.8);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const container = document.createElement("div");
    host.appendChild(container);
    const root = createRoot(container);
    root.render(
      <ApiProvider value={createDemoApi()}>
        <TooltipProvider delayDuration={200}>
          <MemoryRouter>
            <App demo />
          </MemoryRouter>
        </TooltipProvider>
      </ApiProvider>
    );
    return () => {
      setTimeout(() => {
        root.unmount();
        container.remove();
      });
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="h-[min(640px,75svh)] overflow-y-auto overscroll-contain rounded-[1.5rem] bg-background"
    >
      <div ref={hostRef} style={{ zoom }} />
    </div>
  );
}
