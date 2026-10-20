import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Leads from "./pages/Leads";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import { Settings as SettingsIcon } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative shrink-0 px-1 py-1.5 text-sm font-medium transition-colors duration-150 after:absolute after:inset-x-0 after:-bottom-[13px] after:h-[2px] after:rounded-full after:transition-colors after:duration-150",
    isActive
      ? "text-foreground after:bg-primary"
      : "text-muted-foreground after:bg-transparent hover:text-foreground"
  );

function NavLinks() {
  return (
    <>
      <NavLink to="/" end className={navLinkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/applications" className={navLinkClass}>
        Applications
      </NavLink>
      <NavLink to="/leads" className={navLinkClass}>
        Leads
      </NavLink>
      <NavLink to="/resources" className={navLinkClass}>
        Resources
      </NavLink>
    </>
  );
}

export default function App({ demo = false }: { demo?: boolean }) {
  const Header = demo ? "div" : "header";
  const Main = demo ? "div" : "main";
  return (
    <div className="min-h-screen bg-background">
      <Header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between gap-4 py-3.5 md:grid md:grid-cols-[1fr_auto_1fr]">
            <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
              <LogoMark className="size-5 text-foreground" />
              huntlog
            </span>
            <nav
              aria-label="App sections"
              className="hidden items-center gap-6 justify-self-center md:flex"
            >
              <NavLinks />
            </nav>
            {demo ? (
              <span className="hidden md:block" />
            ) : (
              <div className="flex items-center gap-1 justify-self-end">
                <NavLink
                  to="/settings"
                  aria-label="Settings"
                  className={({ isActive }) =>
                    cn(
                      "inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )
                  }
                >
                  <SettingsIcon className="size-4" />
                </NavLink>
                <ThemeToggle />
              </div>
            )}
          </div>
          <nav
            aria-label="App sections"
            className="-mx-6 flex items-center gap-6 overflow-x-auto px-6 pb-3 md:hidden"
          >
            <NavLinks />
          </nav>
        </div>
      </Header>
      <Main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/resources" element={<Resources />} />
          {!demo && <Route path="/settings" element={<Settings />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Main>
    </div>
  );
}
