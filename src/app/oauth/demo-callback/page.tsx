'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  User,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function DemoCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const [isExchanging, setIsExchanging] = useState(false);
  const [tokens, setTokens] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExchange = async () => {
    if (!code) return;
    setIsExchanging(true);
    try {
      // 1. เรียก POST /api/oauth/token
      const res = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: 'super-app-nhh-11018',
          client_secret: 'secret_nhh_superapp_2026',
          redirect_uri: 'http://localhost:3030/oauth/demo-callback',
        }),
      });

      const data = await res.json();
      setTokens(data);

      if (data.access_token) {
        // 2. เรียก GET /api/oauth/userinfo
        const userRes = await fetch('/api/oauth/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const userData = await userRes.json();
        setUserInfo(userData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/console" className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
            ← กลับสู่ Console
          </Link>
          <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
            OAuth 2.0 Client Playground
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            จำลองผลลัพธ์ OAuth 2.0 Callback
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            ทดสอบการรับ Authorization Code และแลกเปลี่ยน Token กับ Identity Provider (NHH-SSO IdP)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-4 text-xs">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}

        {/* Step 1: Authorization Code */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              ขั้นตอนที่ 1 : ได้รับ Authorization Code จาก IdP
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">state: {state || 'N/A'}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono text-xs flex items-center justify-between">
            <span className="text-emerald-700 dark:text-emerald-400 truncate mr-2">{code || 'ไม่มี Code'}</span>
            {code && (
              <button
                onClick={() => handleCopy(code, 'code')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {copied === 'code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {!tokens && (
            <button
              onClick={handleExchange}
              disabled={!code || isExchanging}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md"
            >
              {isExchanging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังแลกเปลี่ยน Token...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>แลกเปลี่ยน Token (POST /api/oauth/token)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Step 2: Tokens */}
        {tokens && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              ขั้นตอนที่ 2 : ได้รับ Token Response จาก IdP
            </span>
            <pre className="p-3 bg-zinc-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto">
              {JSON.stringify(tokens, null, 2)}
            </pre>
          </div>
        )}

        {/* Step 3: UserInfo */}
        {userInfo && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
              ขั้นตอนที่ 3 : ข้อมูลผู้ใช้งานที่ได้จาก UserInfo Endpoint
            </span>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{userInfo.name}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {userInfo.organization?.hname_th} [{userInfo.hospital_code}] • {userInfo.position}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">Provider ID: {userInfo.provider_id || 'N/A'}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DemoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <DemoCallbackContent />
    </Suspense>
  );
}

