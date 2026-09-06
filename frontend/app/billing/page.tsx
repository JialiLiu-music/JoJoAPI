"use client";

import { useEffect, useState } from "react";

import { AppShell, MetricCard } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";
import { apiRequest, authHeaders } from "../../lib/api";

type BillingSummary = {
  balance: string | number;
  currency: string;
};

type BillingOrder = {
  id: number;
  amount: string | number;
  status: string;
  created_at: string;
};

type UsageRecord = {
  id: number;
  model: string;
  cost: string | number;
  total_tokens: number;
  status: string;
  created_at: string;
};

export default function BillingPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => <BillingContent session={currentSession} />}
    </SessionGate>
  );
}

function BillingContent({ session }: { session: ReturnType<typeof useSessionGuard> }) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [amount, setAmount] = useState("20.00");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.token) {
      return;
    }

    const headers = authHeaders(session.token);
    Promise.all([
      apiRequest<BillingSummary>("/v1/billing/summary", { headers }),
      apiRequest<BillingOrder[]>("/v1/billing/orders", { headers }),
      apiRequest<UsageRecord[]>("/v1/usage", { headers }),
    ])
      .then(([accountSummary, orderList, usageList]) => {
        setSummary(accountSummary);
        setOrders(orderList);
        setUsage(usageList);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载账单数据");
      })
      .finally(() => setLoading(false));
  }, [session.token]);

  const totalSpent = usage.reduce((sum, record) => sum + Number(record.cost), 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const successfulOrders = orders.filter((order) => order.status === "completed" || order.status === "paid").length;

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.token) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("请输入有效的充值金额");
      return;
    }

    setWorking(true);
    setError("");
    try {
      const created = await apiRequest<BillingOrder>("/v1/billing/orders", {
        method: "POST",
        headers: authHeaders(session.token),
        body: JSON.stringify({ amount: amount.trim() }),
      });
      setOrders((current) => [created, ...current]);
      setAmount("20.00");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建充值订单失败");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell title="账单" description="查看余额、充值订单和累计消费。" session={session}>
      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="可用余额" value={`$${Number(summary?.balance ?? 0).toFixed(2)}`} hint={summary?.currency ?? "USD"} />
        <MetricCard label="累计消费" value={`$${totalSpent.toFixed(2)}`} hint={`${usage.length} 条用量记录`} />
        <MetricCard label="充值订单" value={String(orders.length)} hint={`${successfulOrders} 笔已完成，${pendingOrders} 笔待处理`} />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <form onSubmit={createOrder} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">创建充值订单</h2>
          <p className="mt-2 text-sm text-slate-400">这里先生成一笔待处理订单，后续可接入支付网关自动确认到账。</p>
          <label className="mt-5 block text-sm text-slate-300">
            充值金额
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="20.00"
            />
          </label>
          <button
            type="submit"
            disabled={working}
            className="mt-5 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "创建中…" : "创建充值订单"}
          </button>
        </form>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">最近用量</h2>
          <p className="mt-2 text-sm text-slate-400">直接读取 `/v1/usage`，反映当前账户的真实消费行为。</p>
          {loading ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
          ) : usage.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无消费记录</p>
          ) : (
            <div className="mt-6 space-y-3">
              {usage.slice(0, 5).map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{record.model}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(record.created_at).toLocaleString("zh-CN")} · {record.total_tokens} tokens
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${record.status === "success" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">费用 ${Number(record.cost).toFixed(4)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">充值订单</h2>
            <p className="mt-2 text-sm text-slate-400">用于管理到账前的充值单据状态。</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">共 {orders.length} 条</span>
        </div>
        {loading ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">加载中…</p>
        ) : orders.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">暂无充值订单</p>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                <div>
                  <p className="font-medium text-white">订单 #{order.id}</p>
                  <p className="mt-1 text-xs text-slate-500">创建于 {new Date(order.created_at).toLocaleString("zh-CN")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">${Number(order.amount).toFixed(2)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${order.status === "pending" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
