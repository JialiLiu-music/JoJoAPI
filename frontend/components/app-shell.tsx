"use client";

import Link from "next/link";

import type { SessionState } from "./session-state";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Account", "/account"],
  ["API Keys", "/api-key"],
  ["Billing", "/billing"],
  ["History", "/history"],
  ["Admin", "/admin"],
];

export function AppShell({
  title,
  description,
  children,
  session,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  session: SessionState;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 lg:block">
          <Link href="/" className="text-xl font-bold tracking-tight">
            AI Gateway
          </Link>
          <nav className="mt-8 space-y-2">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Control Center</p>
                <h1 className="mt-3 text-3xl font-bold">{title}</h1>
                <p className="mt-2 max-w-3xl text-slate-400">{description}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-right">
                {session.loading ? (
                  <p className="text-sm text-slate-500">加载账户中…</p>
                ) : session.user ? (
                  <>
                    <p className="text-sm font-medium text-white">{session.user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.user.is_admin ? "管理员" : "普通用户"} · 余额 ${Number(session.user.balance).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-red-200">{session.error || "未获取到会话"}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/account"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/50 hover:text-white"
              >
                我的账户
              </Link>
              <button
                type="button"
                onClick={session.logout}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
              >
                退出登录
              </button>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}