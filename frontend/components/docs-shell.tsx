import Link from "next/link";
import type { ReactNode } from "react";

export type DocsAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export type DocsStat = {
  label: string;
  value: string;
  hint: string;
};

export type DocsLink = {
  href: string;
  label: string;
};

const defaultLinks: DocsLink[] = [
  { href: "/", label: "首页" },
  { href: "/models", label: "模型" },
  { href: "/pricing", label: "套餐定价" },
  { href: "/docs/sdk", label: "OpenAI SDK" },
  { href: "/docs/api-key", label: "API Key 文档" },
];

function actionClassName(variant: DocsAction["variant"] = "secondary") {
  return variant === "primary"
    ? "rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
    : "rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-white";
}

export function DocsShell({
  eyebrow,
  title,
  description,
  actions = [],
  stats = [],
  links = defaultLinks,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: DocsAction[];
  stats?: DocsStat[];
  links?: DocsLink[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-4 backdrop-blur">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              JoJoapi
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-cyan-300">Commercial Docs</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-800 bg-slate-950/40 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{description}</p>

            {actions.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link key={action.href} href={action.href} className={actionClassName(action.variant)}>
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{stat.hint}</p>
              </article>
            ))}
          </div>
        </section>

        <section>{children}</section>
      </div>
    </main>
  );
}