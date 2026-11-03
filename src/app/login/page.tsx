'use client';

import { Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  ChevronRight,
  Building2,
  Fingerprint,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const loginHref = callbackUrl
    ? `/api/auth/provider-id?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/api/auth/provider-id';

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            router.replace(callbackUrl || '/console');
          }
        }
      } catch {}
    }
    checkAuthSession();
  }, [router, callbackUrl]);

  let errorMessage = '';
  if (errorParam === 'invalid_state' || errorParam === 'state_mismatch') {
    errorMessage = 'เซสชันการยืนยันตัวตนไม่ถูกต้องหรือหมดอายุ เพื่อความปลอดภัยกรุณาลองใหม่อีกครั้ง';
  } else if (errorParam === 'health_id_failed') {
    errorMessage = 'ไม่สามารถแลกเปลี่ยนโทเคนกับระบบ Health ID (MOPH) ได้ กรุณาลองใหม่อีกครั้ง';
  } else if (errorParam === 'token_exchange_failed') {
    errorMessage = 'ไม่สามารถแลกเปลี่ยน Token กับระบบยืนยันตัวตนกลางได้';
  } else if (errorParam === 'session_expired') {
    errorMessage = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  } else if (errorParam === 'not_provider_id') {
    errorMessage = 'ไม่พบบัญชี Provider ID ในฐานข้อมูลกระทรวงสาธารณสุข หรือไม่ได้รับสิทธิ์';
  } else if (errorParam === 'profile_fetch_failed') {
    errorMessage = 'ไม่สามารถดึงข้อมูลโปรไฟล์บุคลากรจากระบบ Provider ID ได้';
  } else if (errorParam === 'provider_not_authorized') {
    errorMessage = 'บัญชี Provider ID ของท่านไม่ได้สังกัด โรงพยาบาลหนองหาน [11018]';
  } else if (errorParam === 'invalid_code') {
    errorMessage = 'รหัส Authorization Code ไม่ถูกต้องหรือถูกใช้งานไปแล้ว กรุณากดเข้าสู่ระบบใหม่';
  } else if (errorParam) {
    errorMessage = `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${errorParam}`;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-emerald-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[36rem] h-[36rem] bg-teal-500/15 dark:bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-emerald-600/10 dark:bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 p-1 border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
            <Image
              src="/nhh.png"
              alt="Logo รพ.หนองหาน"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                ระบบยืนยันตัวตนกลาง (SSO)
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                รพ.หนองหาน [11018]
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Central Single Sign-On & Provider ID Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container: Split Modern View on Large screens, Centered on Mobile */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Graphic & Info (Visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-7 pr-6">
            {/* Hospital Branding Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-zinc-900/80 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 backdrop-blur-md shadow-xs w-fit">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>โรงพยาบาลหนองหาน • รหัสหน่วยบริการ 11018</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                ศูนย์กลางยืนยันตัวตน
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300">
                  Single Sign-On (SSO)
                </span>
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                เข้าสู่ระบบครั้งเดียวด้วยบัญชี <strong className="text-zinc-900 dark:text-zinc-200">Provider ID</strong> กระทรวงสาธารณสุข ด้วยมาตรฐาน <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">OAuth 2.0 Provider ID</strong> สำหรับบุคลากร โรงพยาบาลหนองหาน [11018]
              </p>
            </div>

            {/* Feature highlights pills */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    มาตรฐานความปลอดภัย OAuth 2.0 / OpenID Connect
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    เข้ารหัสข้อมูลมาตรฐานสากล เชื่อมโยงกับฐานข้อมูล สธ. โดยตรง
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-xs">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    ตรวจสอบสิทธิ์บุคลากรสังกัด 11018 อัตโนมัติ
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    สงวนสิทธิ์การเข้าถึงเฉพาะเจ้าหน้าที่ รพ.หนองหาน เพื่อความมั่นคงปลอดภัย
                  </div>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>MOPH Health ID Verified</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Fast SSO Redirection</span>
              </div>
            </div>
          </div>

          {/* Right Login Card (Centered on mobile, column 6 on desktop) */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-emerald-950/5 dark:shadow-none space-y-6 relative">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-b-full" />

              {/* Logo & Header */}
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/60 dark:to-zinc-800 border-2 border-emerald-100 dark:border-emerald-800/80 p-2 flex items-center justify-center shadow-lg shadow-emerald-700/10">
                  <Image
                    src="/nhh.png"
                    alt="Logo รพ.หนองหาน"
                    width={56}
                    height={56}
                    className="object-contain drop-shadow"
                    priority
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                    <Building2 className="w-3 h-3" />
                    <span>โรงพยาบาลหนองหาน [11018]</span>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    เข้าสู่ระบบด้วย Provider ID
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    ระบบยืนยันตัวตนกลางบุคลากรสาธารณสุข สำหรับใช้งานระบบและบริการดิจิทัลทั้งหมด
                  </p>
                </div>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-xs text-red-700 dark:text-red-300 text-left animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Login Button Area */}
              <div className="space-y-3 pt-1">
                <a
                  href={loginHref}
                  className="group relative flex items-center w-full p-3 pr-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 text-white transition-all duration-300 shadow-xl shadow-emerald-700/25 hover:shadow-2xl hover:shadow-emerald-700/35 active:scale-[0.98] overflow-hidden text-left"
                >
                  {/* Shimmer sweep effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                  {/* Provider Logo Box */}
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-white flex items-center justify-center mr-3.5 shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 p-1">
                    <Image
                      src="/providerid.png"
                      width={36}
                      height={36}
                      alt="Provider ID"
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Button Label */}
                  <div className="relative z-10 flex-1">
                    <span className="block text-[15px] sm:text-base font-bold tracking-tight text-white drop-shadow-xs">
                      เข้าสู่ระบบด้วย Provider ID
                    </span>
                    <span className="block text-[11px] text-emerald-100 font-medium">
                      MOPH Health ID • กระทรวงสาธารณสุข
                    </span>
                  </div>

                  {/* Chevron Right Action */}
                  <div className="relative z-10 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-emerald-700 transition-all duration-300">
                    <ChevronRight className="w-5 h-5 text-white group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </a>

                {/* Scope & Hospital Restriction Notice */}
                <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 text-left">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-950 dark:text-amber-100 block">
                      จำกัดสิทธิ์เฉพาะบุคลากร รพ.หนองหาน [11018]
                    </span>
                    <span className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                      ระบบจะตรวจสอบรหัสหน่วยบริการในฐานข้อมูล หากไม่ใช่สังกัด 11018 จะไม่สามารถเข้าใช้งานได้
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & System Info Footer */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit SSL / OAuth 2.0</span>
                </span>
                <span className="text-zinc-400 font-medium">รพ.หนองหาน [11018]</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <p>© 2026 โรงพยาบาลหนองหาน (Nong Han Hospital [11018]). สงวนลิขสิทธิ์ทั้งหมด</p>
        <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 text-xs">
          <span>ระบบยืนยันตัวตนกลาง Health ID</span>
          <span>•</span>
          <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            หน้าหลัก
          </Link>
          <span>•</span>
          <a
            href="https://provider.id.th"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            provider.id.th
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA] dark:bg-zinc-950 font-sans">
          <div className="flex flex-col items-center gap-3 text-xs text-zinc-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <span>กำลังโหลดระบบเข้าสู่ระบบ...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
