"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell, MetricCard } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";
import { apiRequest, authHeaders } from "../../lib/api";

type Overview = {
  total_revenue: string;
  total_calls: number;
};

type AdminUser = {
  id: number;
  email: string;
  balance: string | number;
  is_admin: boolean;
  created_at: string;
};

type ModelPrice = {
  id: number;
  provider: string;
  model: string;
  input_token_price: string | number;
  output_token_price: string | number;
  currency: string;
  is_active: boolean;
};

type ModelPriceDraft = {
  provider: string;
  model: string;
  input_token_price: string;
  output_token_price: string;
  currency: string;
};

const emptyDraft: ModelPriceDraft = {
  provider: "vovoapi",
  model: "",
  input_token_price: "0.0000",
  output_token_price: "0.0000",
  currency: "USD",
};

export default function AdminPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => <AdminContent session={currentSession} />}
    </SessionGate>
  );
}

function AdminContent({ session }: { session: ReturnType<typeof useSessionGuard> }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [modelPrices, setModelPrices] = useState<ModelPrice[]>([]);
  const [draftBalances, setDraftBalances] = useState<Record<number, string>>({});
  const [draftPrice, setDraftPrice] = useState<ModelPriceDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [priceSaving, setPriceSaving] = useState(false);

  useEffect(() => {
    if (!session.token) {
      return;
    }

    const headers = authHeaders(session.token);
    Promise.all([
      apiRequest<Overview>("/v1/admin/overview", { headers }),
      apiRequest<AdminUser[]>("/v1/admin/users", { headers }),
      apiRequest<ModelPrice[]>("/v1/admin/model-prices", { headers }),
    ])
      .then(([summary, userList, priceList]) => {
        setOverview(summary);
        setUsers(userList);
        setModelPrices(priceList);
        setDraftBalances(Object.fromEntries(userList.map((user) => [user.id, String(user.balance)])));
        if (priceList.length > 0) {
          const first = priceList[0];
          setDraftPrice({
            provider: first.provider,
            model: first.model,
            input_token_price: String(first.input_token_price),
            output_token_price: String(first.output_token_price),
            currency: first.currency,
          });
        }
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载管理数据");
      })
      .finally(() => setLoading(false));
  }, [session.token]);

  const activeModels = useMemo(() => modelPrices.filter((item) => item.is_active).length, [modelPrices]);

  async function saveBalance(userId: number) {
    if (!session.token) {
      return;
    }

    setSavingId(userId);
    setError("");
    try {
      const updated = await apiRequest<AdminUser>(`/v1/admin/users/${userId}/balance`, {
        method: "PATCH",
        headers: authHeaders(session.token),
        body: JSON.stringify({ balance: draftBalances[userId] ?? "0" }),
      });
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
      setDraftBalances((current) => ({ ...current, [userId]: String(updated.balance) }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "余额更新失败");
    } finally {
      setSavingId(null);
    }
  }

  async function saveModelPrice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.token) {
      return;
    }

    if (!draftPrice.model.trim()) {
      setError("请输入模型名称");
      return;
    }

    setPriceSaving(true);
    setError("");
    try {
      const updated = await apiRequest<ModelPrice>("/v1/admin/model-prices", {
        method: "PUT",
        headers: authHeaders(session.token),
        body: JSON.stringify({
          provider: draftPrice.provider.trim(),
          model: draftPrice.model.trim(),
          input_token_price: draftPrice.input_token_price,
          output_token_price: draftPrice.output_token_price,
          currency: draftPrice.currency.trim() || "USD",
        }),
      });
      setModelPrices((current) => {
        const filtered = current.filter((item) => !(item.provider === updated.provider && item.model === updated.model));
        return [updated, ...filtered];
      });
      setDraftPrice({
        provider: updated.provider,
        model: updated.model,
        input_token_price: String(updated.input_token_price),
        output_token_price: String(updated.output_token_price),
        currency: updated.currency,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "模型价格保存失败");
    } finally {
      setPriceSaving(false);
    }
  }

  const totalUsers = users.length;

  return (
    <AppShell title="管理后台" description="查看平台运营指标，并管理用户与模型价格。" session={session}>
      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="用户总数" value={String(totalUsers)} hint="注册用户" />
        <MetricCard label="平台收入" value={`$${Number(overview?.total_revenue ?? 0).toFixed(2)}`} hint="累计消费金额" />
        <MetricCard label="API 调用量" value={String(overview?.total_calls ?? 0)} hint={`${activeModels} 个活跃模型价格`} />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">用户管理</h2>
          {loading ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
          ) : users.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无用户</p>
          ) : (
            <div className="mt-4 space-y-3">
              {users.map((user) => (
                <div key={user.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 lg:grid-cols-[2fr,1fr,auto] lg:items-center">
                  <div>
                    <p className="font-medium text-white">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID {user.id} · {user.is_admin ? "管理员" : "普通用户"} · {new Date(user.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <label className="block text-sm text-slate-300">
                    余额
                    <input
                      value={draftBalances[user.id] ?? "0"}
                      onChange={(event) => setDraftBalances((current) => ({ ...current, [user.id]: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={savingId === user.id}
                    onClick={() => saveBalance(user.id)}
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === user.id ? "保存中…" : "保存"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={saveModelPrice} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">模型价格</h2>
              <p className="mt-2 text-sm text-slate-400">统一维护模型单价，供网关计费使用。</p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">共 {modelPrices.length} 条</span>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="block text-sm text-slate-300">
              Provider
              <input
                value={draftPrice.provider}
                onChange={(event) => setDraftPrice((current) => ({ ...current, provider: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Model
              <input
                value={draftPrice.model}
                onChange={(event) => setDraftPrice((current) => ({ ...current, model: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                输入 Token 单价
                <input
                  value={draftPrice.input_token_price}
                  onChange={(event) => setDraftPrice((current) => ({ ...current, input_token_price: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
                />
              </label>
              <label className="block text-sm text-slate-300">
                输出 Token 单价
                <input
                  value={draftPrice.output_token_price}
                  onChange={(event) => setDraftPrice((current) => ({ ...current, output_token_price: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Currency
              <input
                value={draftPrice.currency}
                onChange={(event) => setDraftPrice((current) => ({ ...current, currency: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={priceSaving}
            className="mt-5 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {priceSaving ? "保存中…" : "保存模型价格"}
          </button>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
            ) : modelPrices.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无模型价格</p>
            ) : (
              modelPrices.map((price) => (
                <article key={`${price.provider}-${price.model}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{price.model}</p>
                      <p className="mt-1 text-xs text-slate-500">{price.provider} · {price.currency}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${price.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                      {price.is_active ? "活跃" : "停用"}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">输入价格</dt>
                      <dd className="mt-1 text-base text-white">{String(price.input_token_price)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">输出价格</dt>
                      <dd className="mt-1 text-base text-white">{String(price.output_token_price)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </form>
      </section>
    </AppShell>
  );
}