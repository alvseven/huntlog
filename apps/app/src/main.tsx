import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { IdentityGate } from "./components/identity-gate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <IdentityGate>
            <App />
          </IdentityGate>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
);
