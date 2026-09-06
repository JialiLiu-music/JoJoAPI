"use client";

import { useEffect, useMemo, useState } from "react";

import { DocsShell } from "../../../components/docs-shell";
import { apiRequest } from "../../../lib/api";

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

const tsSnippet = String.raw`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: process.env.AI_GATEWAY_BASE_URL ?? "https://your-domain/v1",
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "__MODEL__",
    messages: [
      { role: "system", content: "你是一个严谨的助手。" },
      { role: "user", content: "请用三句话解释 AI Gateway 的价值。" },
    ],
    temperature: 0.2,
  });

  console.log(completion.choices[0]?.message?.content ?? "");
}

main().catch(console.error);`;

const streamSnippet = String.raw`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: process.env.AI_GATEWAY_BASE_URL ?? "https://your-domain/v1",
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "__MODEL__",
    messages: [{ role: "user", content: "生成一个欢迎页文案。" }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
  }
}

main().catch(console.error);`;

const pythonSnippet = String.raw`from openai import OpenAI

client = OpenAI(
    api_key="AI_GATEWAY_API_KEY",
    base_url="https://your-domain/v1",
)

response = client.chat.completions.create(
    model="__MODEL__",
    messages=[
        {"role": "system", "content": "你是一个严谨的助手。"},
        {"role": "user", "content": "请用一句话介绍你的能力。"},
    ],
)

print(response.choices[0].message.content)`;

const installSnippet = `npm install openai
# 或者
pip install openai`;

export default function OpenAISDKPage() {
  const [models, setModels] = useState<PlatformModel[]>([]);
  const [limits, setLimits] = useState<PlatformLimits | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
        setError(requestError instanceof Error ? requestError.message : "无法加载 SDK 示例数据");
      })
      .finally(() => setLoading(false));
  }, []);

  const activeModels = useMemo(() => models.filter((model) => model.is_active), [models]);
  const recommendedModel = activeModels[0]?.model ?? "你的可用模型";
  const rateLimit = limits?.rate_limit_per_minute ?? 60;
  const windowSeconds = limits?.rate_limit_window_seconds ?? 60;

  const tsExample = tsSnippet.replaceAll("__MODEL__", recommendedModel);
  const streamExample = streamSnippet.replaceAll("__MODEL__", recommendedModel);
  const pythonExample = pythonSnippet.replaceAll("__MODEL__", recommendedModel);

  return (
    <DocsShell
      eyebrow="OpenAI SDK"
      title="完整的 SDK 接入示例"
      description="使用官方 OpenAI SDK 指向网关的兼容接口，只需要替换 baseURL 和 API Key，就能完成同步、流式和多语言接入。"
      actions={[
        { href: "/pricing", label: "查看套餐定价", variant: "secondary" },
        { href: "/docs/api-key", label: "查看 API Key 文档", variant: "primary" },
      ]}
      stats={[
        {
          label: "可用模型",
          value: loading ? "…" : String(activeModels.length),
          hint: "直接读取后台模型价格表，展示当前开放的接入目标。",
        },
        {
          label: "默认限流",
          value: `${rateLimit}/分钟`,
          hint: `单 API Key 在 ${windowSeconds} 秒窗口内的默认请求上限。`,
        },
        {
          label: "接入方式",
          value: "OpenAI SDK",
          hint: "兼容 `chat.completions`、流式输出和标准 Bearer 鉴权。",
        },
      ]}
    >
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">接入步骤</h2>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">统一入口 /v1</span>
          </div>

          <ol className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "在控制台创建一个 API Key，并把它安全存入服务端环境变量。",
              `将 SDK 的 baseURL 指向你的网关域名，例如 https://your-domain/v1。`,
              `选择一个当前可用模型，例如 ${recommendedModel}，然后直接调用 chat.completions。`,
            ].map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm font-medium text-white">安装依赖</p>
            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-400">{installSnippet}</pre>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">接入约定</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            {[
              ["请求地址", "POST /v1/chat/completions"],
              ["认证方式", "Authorization: Bearer sk-user-..."],
              ["计费粒度", "按输入 / 输出 token 分别计费"],
              ["限流维度", "按 API Key 统计"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
                <p className="mt-1 font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Node.js / TypeScript 完整示例</h2>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">同步调用</span>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-6 text-slate-300">
            {tsExample}
          </pre>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Python 完整示例</h2>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">官方 SDK</span>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-6 text-slate-300">
            {pythonExample}
          </pre>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">流式输出示例</h2>
            <p className="mt-2 text-sm text-slate-400">适合对话式产品、长文本生成和实时交互场景。</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">SSE 兼容</span>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-6 text-slate-300">
          {streamExample}
        </pre>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">当前可用模型</h2>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
              {loading ? "加载中" : `${activeModels.length} 个可用`}
            </span>
          </div>
          {loading ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              加载中…
            </p>
          ) : activeModels.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
              暂无开放模型
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
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">落地建议</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "把 API Key 放在服务端，不要写入浏览器代码或公开仓库。",
              "不同应用使用不同的 Key，便于限流、审计和快速撤销。",
              "流式调用建议在前端或后端代理层处理 SSE。",
              "在生产环境优先监控 429 与 401，以便定位限流和鉴权问题。",
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DocsShell>
  );
}