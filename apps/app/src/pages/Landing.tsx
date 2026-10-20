import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  ChevronDown,
  FileText,
  Github,
  GraduationCap,
  NotebookPen,
  Upload,
  Workflow,
} from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LiveDemo } from "./landing/live-demo";

const GITHUB_URL = "https://github.com/alvseven/huntlog";

const BRAILLE_SEVEN = [
  [30, 110],
  [70, 30],
  [70, 70],
  [70, 110],
  [150, 30],
  [190, 30],
  [150, 70],
  [190, 70],
] as const;

const FEATURES = [
  {
    icon: Workflow,
    title: "A pipeline, not a spreadsheet",
    body: "Every application moves from applied to offer, and the funnel shows where your search stalls.",
  },
  {
    icon: BellRing,
    title: "Follow-ups that don't slip",
    body: "Give each application a next action and a date. Overdue ones wait at the top of your dashboard.",
  },
  {
    icon: GraduationCap,
    title: "Leads become applications",
    body: "Save roles while you research, then move one into your pipeline the day you apply.",
  },
  {
    icon: FileText,
    title: "Know which resume you sent",
    body: "Keep every version and attach the one you used to each application.",
  },
  {
    icon: NotebookPen,
    title: "Prep notes per stage",
    body: "Write down what the recruiter asked and what to study, filed under the right stage.",
  },
  {
    icon: Upload,
    title: "Bring your data with you",
    body: "Import a huntlog export and pick up where you left off, on any of your devices.",
  },
];

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. huntlog is open source under the MIT license, and you can host it yourself.",
  },
  {
    q: "Do I need an account?",
    a: "No. Your identity is a 24-word recovery phrase created on your device. There's no email, password or profile.",
  },
  {
    q: "Can you see my applications?",
    a: "No. Your data is encrypted on your device before it syncs. The relay only stores ciphertext it can't read.",
  },
  {
    q: "What if I lose my recovery phrase?",
    a: "Devices that are already set up keep working, but nobody can restore your data anywhere else, including us. Keep the phrase in a password manager.",
  },
  {
    q: "Can I bring my existing data?",
    a: "Yes. Settings has an import for huntlog export files, and imported items sit next to what you already have.",
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Landing() {
  const ref = useReveal();
  return (
    <div ref={ref} className="min-h-svh overflow-x-clip bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Privacy />
        <Faq />
        <OpenSource />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>;
}

function Nav() {
  return (
    <header className="relative z-20 bg-background">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <LogoMark className="size-6" />
          huntlog
        </Link>
        <nav
          aria-label="Main"
          className="hidden items-center gap-7 text-base text-muted-foreground md:flex"
        >
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#privacy" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
          <ExternalLink href={GITHUB_URL}>
            <Github className="size-4" aria-hidden="true" />
            GitHub
          </ExternalLink>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild size="sm" className="press rounded-full px-4">
            <Link to="/start">Open app</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function Hero() {
  return (
    <section className="relative">
      <Container className="pt-16 pb-24 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            data-reveal
            style={stagger(0)}
            className="font-display text-[clamp(44px,6vw,84px)] leading-[0.95] font-semibold tracking-[-0.035em]"
          >
            Your job hunt, organized.
          </h1>
          <p
            data-reveal
            style={stagger(1)}
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed sm:text-xl"
          >
            huntlog tracks your applications, follow-ups, leads and resumes. It's encrypted on your
            devices, so nobody else can read it, not even us.
          </p>
          <div
            data-reveal
            style={stagger(2)}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="press h-12 w-full rounded-full px-7 text-base sm:w-auto"
            >
              <Link to="/start">
                Start tracking, free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="press h-12 w-full rounded-full px-7 text-base sm:w-auto"
            >
              <a href="#demo">Try the demo</a>
            </Button>
          </div>
        </div>
        <section
          aria-label="Live demo"
          id="demo"
          data-reveal
          style={stagger(3)}
          className="mt-16 scroll-mt-6 md:mt-20"
        >
          <div className="rounded-[2rem] bg-muted p-2 sm:p-3">
            <LiveDemo />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            This is the real app running on sample data. Click around; nothing you do here is saved.
          </p>
        </section>
      </Container>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-6 pb-24 md:pb-28">
      <Container>
        <div className="max-w-2xl">
          <h2
            data-reveal
            className="font-display text-[clamp(32px,4vw,56px)] leading-[1.02] font-semibold tracking-[-0.03em]"
          >
            Everything your search needs.
          </h2>
          <p data-reveal style={stagger(1)} className="mt-6 text-lg">
            The parts of a job hunt that slip through a spreadsheet, in one place.
          </p>
        </div>
        <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} data-reveal style={stagger(i)}>
              <div className="flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
                <f.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-2 max-w-sm text-base text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ROWS = [12, 9, 11, 7, 12, 10];
const ORDERED = ROWS.flatMap((len, row) =>
  Array.from({ length: len }, (_, col) => ({ x: 20 + col * 27, y: 20 + row * 27, delay: 0 }))
);
const SCRAMBLED = (() => {
  const rand = seeded(7);
  return ORDERED.map(() => ({ x: 14 + rand() * 320, y: 14 + rand() * 148, delay: rand() * 2.4 }));
})();

function DotZone({ kind }: { kind: "plain" | "cipher" }) {
  const dots = kind === "cipher" ? SCRAMBLED : ORDERED;
  const fill = kind === "cipher" ? "var(--muted-foreground)" : "var(--foreground)";
  return (
    <svg viewBox="0 0 348 176" className="w-full" aria-hidden="true">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={kind === "cipher" ? 5 : 7}
          className={kind === "cipher" ? "cipher-dot" : undefined}
          style={{ fill, animationDelay: kind === "cipher" ? `${d.delay}s` : undefined }}
        />
      ))}
    </svg>
  );
}

function Privacy() {
  const zones = [
    {
      kind: "plain" as const,
      title: "Your laptop",
      body: "Everything you add is stored on your device and encrypted with a key that only you hold.",
    },
    {
      kind: "cipher" as const,
      title: "The relay",
      body: "Devices sync through a relay that only ever sees scrambled bytes. It can't read a single application.",
    },
    {
      kind: "plain" as const,
      title: "Your phone",
      body: "Enter your recovery phrase and your phone rebuilds the same data, decrypted on the device.",
    },
  ];
  return (
    <section id="privacy" className="scroll-mt-6 bg-muted/50 py-24 md:py-28">
      <Container>
        <div className="flex flex-col gap-6">
          <h2
            data-reveal
            className="font-display text-[clamp(32px,4vw,56px)] leading-[1.02] font-semibold tracking-[-0.03em]"
          >
            Only your devices can read it.
          </h2>
          <p data-reveal style={stagger(1)} className="max-w-2xl text-lg">
            huntlog is local-first. Applications, notes and resumes live on your devices and are
            encrypted before they sync. The trade-off is simple: your recovery phrase is the only
            key, so keep it in a password manager.
          </p>
        </div>
        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {zones.map((z, i) => (
            <div key={z.title} data-reveal style={stagger(i * 2)}>
              <DotZone kind={z.kind} />
              <h3 className="mt-8 font-display text-2xl font-semibold">{z.title}</h3>
              <p className="mt-2 max-w-sm text-base">{z.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function OpenSource() {
  return (
    <section className="pb-24 md:pb-28">
      <Container>
        <div
          data-reveal
          className="flex flex-col gap-6 rounded-[2rem] bg-foreground px-6 py-8 text-background dark:bg-muted dark:text-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10"
        >
          <div className="flex items-start gap-4">
            <Github className="mt-1 size-7 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                Open source, MIT licensed.
              </h2>
              <p className="mt-2 max-w-lg text-base text-background/75 dark:text-muted-foreground">
                Read the code, check how the encryption works, or host the app and the relay
                yourself.
              </p>
            </div>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-background px-6 text-sm font-medium text-foreground dark:bg-foreground dark:text-background sm:self-auto"
          >
            View on GitHub
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-6 py-24 md:py-28">
      <Container className="max-w-3xl">
        <h2
          data-reveal
          className="text-center font-display text-[clamp(32px,4vw,56px)] leading-[1.02] font-semibold tracking-[-0.03em]"
        >
          Questions, answered.
        </h2>
        <ul data-reveal style={stagger(1)} className="mt-12 border-t border-border">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-border">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium"
                >
                  {f.q}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-300"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                    transitionTimingFunction: "var(--ease-out)",
                  }}
                >
                  <p className="overflow-hidden">
                    <span className="block max-w-[62ch] pb-6 text-base text-muted-foreground">
                      {f.a}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p
          data-reveal
          style={stagger(2)}
          className="mt-8 text-center text-base text-muted-foreground"
        >
          Something else on your mind?{" "}
          <a
            href={`${GITHUB_URL}/issues`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Ask on GitHub
          </a>
        </p>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pb-24 md:pb-28">
      <Container>
        <div className="flex flex-col items-center rounded-[2rem] bg-muted px-6 py-14 text-center sm:py-16">
          <svg
            viewBox="0 0 220 140"
            className="h-14 w-auto text-foreground sm:h-16"
            role="img"
            aria-label="huntlog"
          >
            {BRAILLE_SEVEN.map(([cx, cy], i) => (
              <circle
                key={`${cx}-${cy}`}
                data-reveal
                style={stagger(i)}
                cx={cx}
                cy={cy}
                r={18}
                fill="currentColor"
                className="[transform-box:fill-box] [transform-origin:center]"
              />
            ))}
          </svg>
          <h2
            data-reveal
            style={stagger(4)}
            className="mt-8 max-w-2xl font-display text-[clamp(28px,3.2vw,44px)] leading-[1.05] font-semibold tracking-[-0.03em]"
          >
            Start your search log.
          </h2>
          <p data-reveal style={stagger(5)} className="mt-6 max-w-md text-lg">
            No sign-up and no email. huntlog creates your private key on your device and opens an
            empty dashboard.
          </p>
          <div
            data-reveal
            style={stagger(6)}
            className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="press h-12 w-full rounded-full px-7 text-base sm:w-auto"
            >
              <Link to="/start">
                Start fresh
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="press h-12 w-full rounded-full border-transparent bg-background px-7 text-base hover:bg-background/70 sm:w-auto"
            >
              <Link to="/start?restore">I have a recovery phrase</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <Container className="flex flex-col gap-6 pb-12 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <LogoMark className="size-6" />
          huntlog
        </Link>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-7 gap-y-3 text-base text-muted-foreground"
        >
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#privacy" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
          <ExternalLink href={GITHUB_URL}>
            <Github className="size-4" aria-hidden="true" />
            GitHub
          </ExternalLink>
        </nav>
        <p className="text-sm text-muted-foreground">© 2026 huntlog · MIT License</p>
      </Container>
    </footer>
  );
}
