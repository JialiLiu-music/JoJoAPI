"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest, authHeaders, clearAccessToken, getAccessToken } from "../lib/api";


export type SessionUser = {
  id: number;
  email: string;
  balance: string | number;
  is_admin: boolean;
  created_at?: string | null;
};

export type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  error: string;
  token: string | null;
  logout: () => void;
};

function SessionPendingState({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 px-6 py-8 text-center shadow-2xl shadow-slate-950/60">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">JoJoapi</p>
        <p className="mt-4 text-lg font-medium text-white">{label}</p>
        <p className="mt-2 text-sm text-slate-400">系统正在确认当前登录状态。</p>
      </div>
    </main>
  );
}

export function SessionGate({
  session,
  loadingLabel = "加载会话中…",
  redirectLabel = "正在跳转登录页…",
  children,
}: {
  session: SessionState;
  loadingLabel?: string;
  redirectLabel?: string;
  children: (session: SessionState) => ReactNode;
}) {
  if (session.loading) {
    return <SessionPendingState label={loadingLabel} />;
  }

  if (!session.user) {
    return <SessionPendingState label={session.error || redirectLabel} />;
  }

  return <>{children(session)}</>;
}

export function useSessionGuard(): SessionState {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token] = useState<string | null>(() => getAccessToken());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      clearAccessToken();
      router.replace("/login");
      return;
    }

    let active = true;

    apiRequest<SessionUser>("/v1/users/me", { headers: authHeaders(token) })
      .then((sessionUser) => {
        if (active) {
          setUser(sessionUser);
        }
      })
      .catch((requestError) => {
        if (active) {
          clearAccessToken();
          setUser(null);
          setError(requestError instanceof Error ? requestError.message : "会话已失效，请重新登录");
          router.replace("/login");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, token]);

  const logout = useCallback(() => {
    clearAccessToken();
    router.replace("/login");
  }, [router]);

  return {
    user,
    loading,
    error: token ? error : "请先登录后再继续",
    token,
    logout,
  };
}
