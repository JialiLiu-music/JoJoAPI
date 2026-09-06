"use client";

import { useEffect, useMemo, useState } from "react";

import { DocsShell } from "../../components/docs-shell";
import { apiRequest } from "../../lib/api";

type PlatformModel = {
  provider: string;
  model: string;
  input_token_price: string | number;
  output_token_price: string | number;
  currency: string;
  is_active: boolean;
};

type PlatformLimits = {
  rate_limit_per_minute: number;
  rate_limit_window_seconds: number;
  scope: string;
};

function formatPrice(value: string | number) {
  return Number(value).toFixed(6);
}

export default function PricingPage() {
  const [models, setModels] = useState<PlatformModel[]>([]);
  const [limits, setLimits] = useState<PlatformLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<PlatformModel[]>("/v1/platform/models"),
      apiRequest<PlatformLimits>("/v1/platform/limits"),
    ])
      .then(([modelList, limitInfo]) => {
        setModels(modelList);
        setLimits(limitInfo);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载套餐信息");
      })
      .finally(() => setLoading(false));
  }, []);

  const activeModels = useMemo(() => models.filter((model) => model.is_active), [models]);
  const currencies = useMemo(() => Array.from(new Set(activeModels.map((model) => model.currency))), [activeModels]);
  const minInputPrice = useMemo(() => {
    if (activeModels.length === 0) return null;
    return Math.min(...activeModels.map((model) => Number(model.input_token_price)));
  }, [activeModels]);
  const minOutputPrice = useMemo(() => {
    if (activeModels.length === 0) return null;
    return Math.min(...activeModels.map((model) => Number(model.output_token_price)));
  }, [activeModels]);

  const rateLimit = limits?.rate_limit_per_minute ?? 60;
  const windowSeconds = limits?.rate_limit_window_seconds ?? 60;
  const scope = limits?.scope ?? "per-api-key";

  return (
    <DocsShell
      eyebrow="套餐 / 定价 / 限流"
      title="商业化定价页"
      description="将模型 token 价格、API Key 限流和服务套餐放在同一页，方便客户评估成本、吞吐和接入方式。"
      actions={[
        { href: "/pricing", label: "刷新定价页", variant: "secondary" },
        { href: "/docs/sdk", label: "查看接入示例", variant: "primary" },
      ]}
      stats={[
        {
          label: "活跃模型",
          value: loading ? "…" : String(activeModels.length),
          hint: "仅统计当前可用的模型价格记录。",
        },
        {
          label: "默认限流",
          value: `${rateLimit}/分钟`,
          hint: `按 ${scope} 统计，窗口为 ${windowSeconds} 秒。`,
        },
        {
          label: "支持币种",
          value: currencies.length > 0 ? currencies.join(" / ") : "USD",
          hint: "价格表当前展示的币种集合。",
        },
      ]}
    >
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        {[
          {
            name: "Starter",
            price: "按 token 实时计费",
            highlight: "适合快速试用、内部验证和单个应用接入。",
            bullets: ["OpenAI 兼容接口", `默认限流 ${rateLimit}/分钟`, "基础账单与用量追踪"],
          },
          {
            name: "Growth",
            price: "按 token 实时计费",
            highlight: "适合稳定生产、多个服务共享和更高调用强度。",
            bullets: ["一应用一 Key", "更细的审计和撤销能力", "建议结合后台监控 429 与余额预警"],
            featured: true,
          },
          {
            name: "Enterprise",
            price: "定制",
            highlight: "适合需要 SLA、专属额度和合同化对接的客户。",
            bullets: ["可协商更高限流", "定制模型白名单", "专属对接与账单流程"],
          },
        ].map((plan) => (
          <article
            key={plan.name}
            className={`rounded-3xl border p-6 ${plan.featured ? "border-cyan-400/40 bg-cyan-400/10" : "border-slate-800 bg-slate-900/70"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              {plan.featured ? <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-300">推荐</span> : null}
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{plan.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{plan.highlight}</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              {plan.bullets.map((bullet) => (
                <li key={bullet} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">模型价格表</h2>
              <p className="mt-2 text-sm text-slate-400">当前价格来源于后台模型价格配置，适合直接对外展示。</p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
              {loading ? "加载中" : `${activeModels.length} 条价格记录`}
            </span>
          </div>

          {loading ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              加载中…
            </p>
          ) : activeModels.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              暂无可展示的价格表
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {activeModels.map((model) => (
                <article key={`${model.provider}:${model.model}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{model.model}</p>
                      <p className="mt-1 text-xs text-slate-500">Provider: {model.provider}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">{model.currency}</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Input</p>
                      <p className="mt-1 font-medium text-white">${formatPrice(model.input_token_price)} / token</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Output</p>
                      <p className="mt-1 font-medium text-white">${formatPrice(model.output_token_price)} / token</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">限流策略</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            当前后端以 API Key 为粒度进行限流，超过阈值后返回 429。Redis 故障时会放行请求以避免核心 API 中断，但生产环境应监控并恢复限流能力。
          </p>

          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {[
              ["限流窗口", `${windowSeconds} 秒`],
              ["默认速率", `${rateLimit} 次 / 分钟`],
              ["统计对象", scope],
              ["异常策略", "Redis 不可用时优先保证可用性"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
                <p className="mt-1 font-medium text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">最低输入价</p>
              <p className="mt-1 font-medium text-white">
                {minInputPrice === null ? "—" : `$${minInputPrice.toFixed(6)} / token`}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">最低输出价</p>
              <p className="mt-1 font-medium text-white">
                {minOutputPrice === null ? "—" : `$${minOutputPrice.toFixed(6)} / token`}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
            <p className="font-medium text-white">商业说明</p>
            <p className="mt-2 text-slate-400">
              套餐层负责对外表达服务等级，底层仍按 token 使用量结算。这样可以把产品包装、风控和成本控制分开。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">适合对外展示的商业话术</h2>
            <p className="mt-2 text-sm text-slate-400">这部分可以直接用于官网、销售页或对外方案说明。</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">可直接复用</span>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {[
            "统一 OpenAI 兼容接口，降低迁移成本。",
            "按 token 精细计费，避免套餐浪费。",
            "按 API Key 限流和审计，方便商业化运营。",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    </DocsShell>
  );
}