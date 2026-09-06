import Link from "next/link";

import { DocsShell } from "../../../components/docs-shell";

const curlExample = `curl https://your-domain/v1/chat/completions \
  -H "Authorization: Bearer sk-user-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model",
    "messages": [{"role": "user", "content": "你好"}]
  }'`;

const fetchExample = `const response = await fetch("https://your-domain/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer sk-user-your-api-key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "your-model",
    messages: [{ role: "user", content: "你好" }],
  }),
});

const data = await response.json();`;

export default function ApiKeyDocsPage() {
  return (
    <DocsShell
      eyebrow="API Key 使用文档"
      title="把 Key 当成服务端凭证，而不是前端配置"
      description="这里说明如何创建、使用、轮换和撤销 API Key。真实调用只认 Bearer 头中的 Key，适合服务端、网关和后端代理层接入。"
      actions={[
        { href: "/api-key", label: "进入 Key 管理页", variant: "primary" },
        { href: "/docs/sdk", label: "查看 SDK 示例", variant: "secondary" },
      ]}
      stats={[
        {
          label: "创建后的展示策略",
          value: "只展示一次",
          hint: "完整 Key 只在创建时返回，之后列表仅保留前缀和状态。",
        },
        {
          label: "鉴权头",
          value: "Bearer",
          hint: "网关按 `Authorization: Bearer ...` 解析 API Key。",
        },
        {
          label: "建议做法",
          value: "一应用一 Key",
          hint: "便于审计、撤销和按应用做限流。",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">使用流程</h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "在控制台的 API Key 页面创建 Key，创建完成后立刻复制保存。",
              "把 Key 放到服务端环境变量、密钥管理系统或网关配置中。",
              "调用网关时，把 Key 放进 Authorization: Bearer 头。",
              "如果怀疑泄露，立即在控制台撤销，并重新生成新的 Key。",
            ].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">生命周期规则</h2>
          <dl className="mt-5 space-y-3 text-sm text-slate-300">
            {[
              ["创建", "只有创建时能看到完整 Key，之后不会再次返回。"],
              ["列表", "列表只展示前缀和状态，不泄露完整凭证。"],
              ["撤销", "撤销后无法恢复，适合泄露处置和权限回收。"],
              ["状态", "active 表示可用，revoked 表示已失效。"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</dt>
                <dd className="mt-1 font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">标准请求示例</h2>
            <p className="mt-2 text-sm text-slate-400">后端和 SDK 都应使用同一份 Key，不要在客户端重复分发。</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">兼容 OpenAI 风格请求</span>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm font-medium text-white">curl</p>
            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-300">{curlExample}</pre>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm font-medium text-white">fetch / 后端代理</p>
            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-300">{fetchExample}</pre>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">安全建议</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "不要把 API Key 放进前端 bundle、静态页面或公开日志。",
              "推荐每个服务、环境或团队单独创建一个 Key。",
              "如果密钥被复制到错误位置，先撤销再重新发放。",
              "使用权限最小化原则，只在必要系统中保存完整 Key。",
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">管理入口</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            如果你已经登录，可以直接进入 Key 管理页创建或撤销凭证；如果还没有账号，先完成注册。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/api-key" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              打开 Key 管理页
            </Link>
            <Link href="/register" className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-white">
              注册新账号
            </Link>
          </div>
        </div>
      </section>
    </DocsShell>
  );
}