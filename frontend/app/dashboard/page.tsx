"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell, MetricCard } from "../../components/app-shell";
import { SessionGate, useSessionGuard } from "../../components/session-state";
import { apiRequest, authHeaders } from "../../lib/api";

type User = {
  balance: string | number;
};

type Usage = {
  cost: string | number;
  status: string;
};

type APIKey = {
  status: string;
};

export default function DashboardPage() {
  const session = useSessionGuard();

  return (
    <SessionGate session={session}>
      {(currentSession) => <DashboardContent session={currentSession} token={currentSession.token} />}
    </SessionGate>
  );
}

function DashboardContent({
  session,
  token,
}: {
  session: ReturnType<typeof useSessionGuard>;
  token: string | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    const headers = authHeaders(token);

    Promise.all([
      apiRequest<User>("/v1/users/me", { headers }),
      apiRequest<Usage[]>("/v1/usage", { headers }),
      apiRequest<APIKey[]>("/v1/api-keys", { headers }),
    ])
      .then(([account, records, keys]) => {
        setUser(account);
        setUsage(records);
        setApiKeys(keys);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载账户数据");
      });
  }, [token]);

  const activeKeys = apiKeys.filter((key) => key.status === "active").length;
  const totalCost = usage.reduce((sum, record) => sum + Number(record.cost), 0);

  return (
    <AppShell title="控制台" description="查看账户状态、API 使用情况和最近活动。" session={session}>
      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="账户余额" value={`$${Number(user?.balance ?? 0).toFixed(2)}`} hint="充值后即可开始调用" />
        <MetricCard label="累计调用" value={String(usage.length)} hint={`累计消费 $${totalCost.toFixed(2)}`} />
        <MetricCard label="活跃 API Key" value={String(activeKeys)} hint="建议按应用分别创建" />
      </div>
      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-medium text-cyan-300">快速开始</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">连接第一个模型</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          创建 API Key，将请求地址替换为当前网关地址，即可使用 OpenAI 兼容接口。
        </p>
        <Link href="/api-key" className="mt-5 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
          管理 API Key
        </Link>
      </section>
    </AppShell>
  );
}
