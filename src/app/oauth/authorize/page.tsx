'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Fingerprint,
  Loader2,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function AuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get('client_id') || '';
  const redirectUri = searchParams.get('redirect_uri') || '';
  const responseType = searchParams.get('response_type') || '';
  const state = searchParams.get('state') || '';
  const scope = searchParams.get('scope') || 'openid profile provider hospital.11018';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (!clientId || !redirectUri) {
          setError('พารามิเตอร์ไม่ครบถ้วน: ต้องระบุ client_id และ redirect_uri');
          setIsLoading(false);
          return;
        }

        if (responseType !== 'code') {
          setError('response_type ต้องเป็น code เท่านั้น');
          setIsLoading(false);
          return;
        }

        // 1. ดึงข้อมูล Client App
        const clientRes = await fetch(`/api/oauth/clients?client_id=${encodeURIComponent(clientId)}`);
        if (!clientRes.ok) {
          setError('ไม่พบ Client Application นี้ในระบบ หรือยังไม่ได้รับอนุญาต');
          setIsLoading(false);
          return;
        }
        const clientData = await clientRes.json();
        setClientInfo(clientData.client);

        // 2. ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
          }
        }
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [clientId, redirectUri, responseType]);

  const handleAuthorize = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          redirectUri,
          scope,
          state,
          action: 'approve',
        }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error_description || 'เกิดข้อผิดพลาดในการสร้าง Authorization Code');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          redirectUri,
          scope,
          state,
          action: 'deny',
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>กำลังตรวจสอบคำขอ OAuth 2.0...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">คำขอ OAuth 2.0 ไม่ถูกต้อง</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{error}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Top Navbar */}
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center p-1">
            <Image src="/nhh.png" alt="NHH Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 block leading-tight">
              ระบบยืนยันตัวตนกลาง (OAuth 2.0 IdP)
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              โรงพยาบาลหนองหาน [11018]
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Consent Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              คำขออนุญาตเข้าถึงข้อมูล
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              แอปพลิเคชันต้องการยืนยันตัวตนของคุณผ่านระบบ SSO โรงพยาบาลหนองหาน
            </p>
          </div>

          {/* Client Application Info Box */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                แอปพลิเคชันที่ขอเชื่อมต่อ
              </span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {clientInfo?.name || 'แอปพลิเคชันเครือข่าย รพ.หนองหาน'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {clientInfo?.description || clientInfo?.clientId}
              </p>
            </div>
          </div>

          {/* Check User Authentication Status */}
          {currentUser ? (
            /* Logged in User Card */
            <div className="space-y-4">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {currentUser.fullName ? currentUser.fullName.charAt(0) : 'น'}
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">เข้าสู่ระบบในชื่อ</span>
                    <strong className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                      {currentUser.fullName}
                    </strong>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {currentUser.hospitalName} [{currentUser.hospitalCode}] • {currentUser.position}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Provider ID
                </span>
              </div>

              {/* Scopes Requested */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  สิทธิ์การเข้าถึงที่แอปพลิเคชันร้องขอ:
                </span>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5">
                  <li className="flex items-start gap-2.5">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>ข้อมูลส่วนตัวพื้นฐาน (ชื่อ-นามสกุล, ตำแหน่ง, รหัสบุคลากร)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>ข้อมูลสังกัดหน่วยบริการ: โรงพยาบาลหนองหาน [11018]</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Fingerprint className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>สถานะการยืนยันตัวตนด้วย Provider ID กระทรวงสาธารณสุข</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDeny}
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  ปฏิเสธ (Deny)
                </button>

                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งผล...</span>
                    </>
                  ) : (
                    <>
                      <span>ยินยอม (Authorize)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* User NOT logged in */
            <div className="space-y-4 text-center">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-left">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  ท่านยังไม่ได้เข้าสู่ระบบ กรุณายืนยันตัวตนด้วย Provider ID ของโรงพยาบาลหนองหาน [11018] ก่อนดำเนินการอนุญาต
                </span>
              </div>

              <a
                href={`/api/auth/provider-id?callbackUrl=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? window.location.pathname + window.location.search
                    : `/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${encodeURIComponent(responseType)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`
                )}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md"
              >
                <Fingerprint className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วย Provider ID ก่อน</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}

