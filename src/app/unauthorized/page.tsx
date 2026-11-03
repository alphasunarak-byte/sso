import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
            <span>403 Forbidden • จำกัดสิทธิ์การเข้าถึง</span>
          </div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            ไม่ได้รับอนุญาตให้เข้าใช้งานระบบ
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            ระบบนี้จำกัดสิทธิ์เฉพาะบุคลากรที่สังกัด <strong>โรงพยาบาลหนองหาน [11018]</strong> ที่ผ่านการยืนยันตัวตนด้วย Provider ID กระทรวงสาธารณสุข เท่านั้น
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-700/60 text-left space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-200">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>คำแนะนำ:</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
            หากท่านเป็นบุคลากรของโรงพยาบาลหนองหาน แต่พบหน้านี้ กรุณาตรวจสอบสถานะสังกัดในระบบ MOPH IDP หรือติดต่อผู้ดูแลระบบศูนย์คอมพิวเตอร์/งานเทคโนโลยีสารสนเทศ รพ.หนองหาน
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าเข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

