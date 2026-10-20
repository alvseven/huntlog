import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { IdentityGate } from "./components/identity-gate";
import { isAppHost } from "./lib/hosts";
import Landing from "./pages/Landing";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          {isAppHost ? (
            <IdentityGate>
              <App />
            </IdentityGate>
          ) : (
            <Routes>
              <Route path="*" element={<Landing />} />
            </Routes>
          )}
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
);
