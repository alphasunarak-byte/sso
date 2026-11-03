'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  ShieldCheck,
  Building2,
  LogOut,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSession(data.user);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>กำลังโหลดข้อมูล Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Top Bar */}
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center p-1">
            <Image src="/nhh.png" alt="NHH Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 block leading-tight">
              ระบบสารสนเทศหลังบ้าน (Dashboard)
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              โรงพยาบาลหนองหาน [11018]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="/api/auth/logout"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-700/20 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>ยืนยันตัวตนสำเร็จผ่าน OAuth 2.0 IdP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ยินดีต้อนรับ, {session?.fullName || 'บุคลากร รพ.หนองหาน'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              คุณได้ผ่านการตรวจสอบสิทธิ์สังกัดโรงพยาบาลหนองหาน [11018] เรียบร้อยแล้ว สามารถเข้าถึงบริการหลังบ้านและระบบงานที่เชื่อมต่อได้ทันที
            </p>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-3xl flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800">
              {session?.fullName ? session.fullName.charAt(0) : 'น'}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{session?.fullName}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{session?.position}</p>
            </div>
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>Provider Verified</span>
              </span>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลการยืนยันตัวตนและสังกัด</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                <span className="text-zinc-400">หน่วยบริการต้นสังกัด</span>
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {session?.hospitalName || 'โรงพยาบาลหนองหาน'}
                </p>
                <span className="text-emerald-600 font-mono font-semibold">รหัสหน่วยบริการ: 11018</span>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                <span className="text-zinc-400">ตำแหน่ง / สายงาน</span>
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {session?.position || 'บุคลากรทางการแพทย์'}
                </p>
                <span className="text-zinc-500 font-mono">Role: {session?.role || 'personnel'}</span>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1 sm:col-span-2">
                <span className="text-zinc-400">Provider ID / Subject ID</span>
                <p className="font-mono font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                  {session?.providerId || 'nhh_provider_authenticated'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>เซสชันได้รับการเข้ารหัสความปลอดภัยด้วย JWT (jose)</span>
              <Link href="/console" className="text-emerald-600 font-semibold hover:underline">
                เปิดหน้า SSO Console →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
