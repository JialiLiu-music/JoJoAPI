"use client";

import { useEffect, useState } from "react";

import { AppShell } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";
import { apiRequest, authHeaders } from "../../lib/api";

type UsageRecord = {
  id: number;
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: string | number;
  status: string;
  error_message: string | null;
  created_at: string;
};

export default function HistoryPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => <HistoryContent session={currentSession} />}
    </SessionGate>
  );
}

function HistoryContent({ session }: { session: ReturnType<typeof useSessionGuard> }) {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.token) {
      return;
    }

    apiRequest<UsageRecord[]>("/v1/usage", { headers: authHeaders(session.token) })
      .then(setRecords)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载调用记录");
      })
      .finally(() => setLoading(false));
  }, [session.token]);

  const totalTokens = records.reduce((sum, record) => sum + record.total_tokens, 0);
  const totalCost = records.reduce((sum, record) => sum + Number(record.cost), 0);
  const failedCount = records.filter((record) => record.status !== "success").length;

  return (
    <AppShell title="调用记录" description="按模型、状态和时间查看最近的真实 API 消耗。" session={session}>
      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm text-slate-400">调用次数</p>
          <p className="mt-3 text-3xl font-semibold text-white">{records.length}</p>
          <p className="mt-2 text-sm text-slate-500">最近 100 条记录</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm text-slate-400">总 Token</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalTokens}</p>
          <p className="mt-2 text-sm text-slate-500">输入 + 输出</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm text-slate-400">累计费用</p>
          <p className="mt-3 text-3xl font-semibold text-white">${totalCost.toFixed(4)}</p>
          <p className="mt-2 text-sm text-slate-500">失败 {failedCount} 条</p>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">最近调用</h2>
            <p className="mt-2 text-sm text-slate-400">展示模型、token 拆分、费用和请求状态。</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">共 {records.length} 条</span>
        </div>

        {loading ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
        ) : records.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无调用记录</p>
        ) : (
          <div className="mt-6 space-y-3">
            {records.map((record) => (
              <article key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{record.model}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.provider} · {new Date(record.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${record.status === "success" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>
                    {record.status}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">输入 Token</dt>
                    <dd className="mt-1 text-base text-white">{record.input_tokens}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">输出 Token</dt>
                    <dd className="mt-1 text-base text-white">{record.output_tokens}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">总 Token</dt>
                    <dd className="mt-1 text-base text-white">{record.total_tokens}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">费用</dt>
                    <dd className="mt-1 text-base text-white">${Number(record.cost).toFixed(4)}</dd>
                  </div>
                </dl>
                {record.error_message ? <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{record.error_message}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}