"use client";

import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../lib/api";

type ModelPrice = {
  provider: string;
  model: string;
  input_token_price: string | number;
  output_token_price: string | number;
  currency: string;
  is_active: boolean;
};

const quickStart = [
  "先创建一个 API Key，用它调用网关，而不是直接调用上游模型。",
  "请求地址固定为 `POST /v1/chat/completions`，兼容 OpenAI SDK 的常见调用方式。",
  "模型名称以后台配置为准，用户可在本页查看当前可用模型与价格。",
];

export default function ModelsPage() {
  const [models, setModels] = useState<ModelPrice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ModelPrice[]>("/v1/platform/models")
      .then(setModels)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "无法加载模型列表");
      })
      .finally(() => setLoading(false));
  }, []);

  const totalModels = useMemo(() => models.length, [models]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Models & Integration</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold text-white">模型与接入说明</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                这里展示当前可用模型和统一计费标准。接入时只需要一个 API Key 和一个 OpenAI 兼容请求地址。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Available</p>
              <p className="mt-1 text-2xl font-semibold text-white">{totalModels}</p>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">快速接入</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {quickStart.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">请求示例</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-400">
{`curl https://你的域名/v1/chat/completions \
  -H "Authorization: Bearer sk-user-你的APIKey" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "${models[0]?.model ?? "your-model"}",
    "messages": [{"role":"user","content":"你好"}]
  }'`}
              </pre>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">当前可用模型</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">OpenAI 兼容</span>
            </div>

            {loading ? (
              <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
                加载中…
              </p>
            ) : models.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
                暂无可用模型
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {models.map((model) => (
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
                        <p className="mt-1 font-medium text-white">${Number(model.input_token_price).toFixed(6)} / token</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Output</p>
                        <p className="mt-1 font-medium text-white">${Number(model.output_token_price).toFixed(6)} / token</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}