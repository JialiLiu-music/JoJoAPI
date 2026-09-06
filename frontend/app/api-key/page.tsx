"use client";

import { useEffect, useState } from "react";

import { AppShell } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";
import { apiRequest } from "../../lib/api";

type APIKey = {
  id: number;
  prefix: string;
  status: string;
  created_at: string | null;
};

type CreatedAPIKey = APIKey & { key: string };

export default function ApiKeyPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => <ApiKeyContent session={currentSession} />}
    </SessionGate>
  );
}

function ApiKeyContent({ session }: { session: ReturnType<typeof useSessionGuard> }) {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedAPIKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.token) {
      return;
    }

    apiRequest<APIKey[]>("/v1/api-keys", { headers: { Authorization: `Bearer ${session.token}` } })
      .then(setKeys)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "无法加载 API Key"))
      .finally(() => setLoading(false));
  }, [session.token]);

  async function createKey() {
    if (!session.token) {
      return;
    }

    setWorking(true);
    setError("");
    try {
      const result = await apiRequest<CreatedAPIKey>("/v1/api-keys", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setCreatedKey(result);
      setKeys((current) => [result, ...current]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建失败，请稍后重试");
    } finally {
      setWorking(false);
    }
  }

  async function revokeKey(id: number) {
    if (!session.token) {
      return;
    }
    if (!window.confirm("确定撤销这个 API Key 吗？撤销后无法恢复。")) return;

    setWorking(true);
    setError("");
    try {
      await apiRequest<void>(`/v1/api-keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setKeys((current) => current.map((key) => (key.id === id ? { ...key, status: "revoked" } : key)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "撤销失败，请稍后重试");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell title="API Key" description="为不同应用创建、查看和撤销访问凭证。" session={session}>
      {error && <p role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">{error}</p>}
      {createdKey && (
        <section className="mb-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6">
          <p className="font-medium text-amber-200">API Key 创建成功</p>
          <p className="mt-2 text-sm text-amber-100/70">请立即复制并安全保存，完整 Key 只会展示这一次。</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-slate-950/70 px-4 py-3 text-sm text-amber-100">{createdKey.key}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(createdKey.key)} className="rounded-xl border border-amber-200/40 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-200/10">
              复制
            </button>
          </div>
        </section>
      )}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">我的 API Keys</h2>
            <p className="mt-2 text-sm text-slate-400">列表仅显示前缀，完整 Key 不会被保存或再次返回。</p>
          </div>
          <button type="button" disabled={working} onClick={createKey} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            {working ? "处理中…" : "创建 API Key"}
          </button>
        </div>
        {loading ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
        ) : keys.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无 API Key</p>
        ) : (
          <div className="mt-6 space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                <div>
                  <code className="text-sm text-slate-200">{key.prefix}••••••••</code>
                  <p className="mt-1 text-xs text-slate-500">创建于 {key.created_at ? new Date(key.created_at).toLocaleString("zh-CN") : "未知时间"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${key.status === "active" ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                    {key.status === "active" ? "活跃" : "已撤销"}
                  </span>
                  {key.status === "active" && (
                    <button type="button" disabled={working} onClick={() => revokeKey(key.id)} className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50">
                      撤销
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}