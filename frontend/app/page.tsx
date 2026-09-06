import Link from "next/link";

const routes = [
  { href: "/login", label: "登录" },
  { href: "/register", label: "注册" },
  { href: "/dashboard", label: "控制台" },
  { href: "/account", label: "我的账户" },
  { href: "/models", label: "模型与接入" },
  { href: "/api-key", label: "API Key" },
  { href: "/billing", label: "账单" },
  { href: "/history", label: "调用记录" },
  { href: "/admin", label: "管理后台" },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <section className="grid gap-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-10 shadow-2xl shadow-slate-950/60 backdrop-blur">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
            AI Gateway Platform
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            商业化 AI API 中转平台
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            用一套 OpenAI 兼容接口统一管理模型调用、API Key、余额与用量。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              进入控制台
            </Link>
            <Link href="/register" className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/50">
              创建账户
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-slate-900">
              {route.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}