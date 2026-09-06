"use client";

import Link from "next/link";

import { AppShell, MetricCard } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";

export default function AccountPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => (
        <AppShell title="我的账户" description="管理当前登录会话、查看账户身份与退出登录。" session={currentSession}>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="账户 ID" value={String(currentSession.user?.id ?? "-")} hint="系统唯一标识" />
            <MetricCard label="账户余额" value={`$${Number(currentSession.user?.balance ?? 0).toFixed(2)}`} hint="当前可用金额" />
            <MetricCard label="账户角色" value={currentSession.user?.is_admin ? "管理员" : "普通用户"} hint="权限范围" />
          </div>
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">会话信息</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">邮箱</dt>
                <dd className="mt-2 text-sm text-slate-200">{currentSession.user?.email ?? "-"}</dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">注册时间</dt>
                <dd className="mt-2 text-sm text-slate-200">
                  {currentSession.user?.created_at ? new Date(currentSession.user.created_at).toLocaleString("zh-CN") : "-"}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={currentSession.logout}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                退出登录
              </button>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/50"
              >
                返回控制台
              </Link>
            </div>
          </section>
        </AppShell>
      )}
    </SessionGate>
  );
}