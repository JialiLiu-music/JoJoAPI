"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authenticate, saveAccessToken } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authenticate(email, password, "register");
      saveAccessToken(result.access_token);
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/50">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">AI Gateway</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">创建账户</h1>
        <p className="mt-2 text-sm text-slate-400">注册后即可创建自己的 API Key。</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-300">邮箱<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" /></label>
          <label className="block text-sm text-slate-300">密码<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button disabled={loading} type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "注册中…" : "注册"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">已有账户？ <Link href="/login" className="text-cyan-300 hover:text-cyan-200">返回登录</Link></p>
      </section>
    </main>
  );
}