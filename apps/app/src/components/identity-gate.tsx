import { useState, type ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNewIdentity, getStoredMnemonic, restoreIdentity } from "@/lib/evolu";
import Landing from "@/pages/Landing";

export function IdentityGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => getStoredMnemonic() !== null);
  if (ready) return children;
  return (
    <Routes>
      <Route path="/start" element={<Onboarding onReady={() => setReady(true)} />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

function Onboarding({ onReady }: { onReady: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restoring, setRestoring] = useState(() => searchParams.has("restore"));
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    createNewIdentity();
    navigate("/", { replace: true });
    onReady();
  };

  const restore = () => {
    const problem = restoreIdentity(phrase);
    if (problem) {
      setError("That doesn't look like a valid recovery phrase. Check the words and their order.");
      return;
    }
    navigate("/", { replace: true });
    onReady();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <Link to="/" aria-label="huntlog home" className="inline-block">
            <LogoMark className="size-10 text-foreground" />
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">huntlog</h1>
          <p className="text-muted-foreground">
            Track your job hunt. Your data lives on your devices and syncs end-to-end encrypted, so
            nobody else can read it, including us.
          </p>
        </div>

        {restoring ? (
          <div className="space-y-3">
            <label htmlFor="phrase" className="text-sm font-medium">
              Recovery phrase
            </label>
            <Textarea
              id="phrase"
              rows={3}
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                setError(null);
              }}
              placeholder="Enter your 24 words, separated by spaces"
              className="font-mono text-sm"
              autoFocus
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={restore} disabled={!phrase.trim()}>
                Restore my data
              </Button>
              <Button variant="ghost" onClick={() => setRestoring(false)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={start}>Start fresh</Button>
            <Button variant="outline" onClick={() => setRestoring(true)}>
              I have a recovery phrase
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
