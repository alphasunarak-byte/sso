'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  KeyRound,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Play,
  LogOut,
  Building2,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  Home,
  Loader2,
  Share2,
  ExternalLink,
  Plus,
  PlusCircle,
  Code2,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { NHH_AUTH_CONFIG } from '@/server/services/auth/auth.service';
import { Environment } from '@/schemas/auth.schema';

export default function ConsolePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'api-monitor' | 'credentials' | 'logs' | 'oauth-idp'>('overview');
  const [environment, setEnvironment] = useState<Environment>('PRD');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Strict Authentication Guard State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // IdP & OAuth Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientRedirect, setNewClientRedirect] = useState('');
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);

  // Edit & Delete Client State
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRedirects, setEditRedirects] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingClient, setDeletingClient] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // API Testing State
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Monitor Metrics State
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  useEffect(() => {
    async function verifyAuthSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            if (data.user.environment) {
              setEnvironment(data.user.environment);
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    verifyAuthSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof document !== 'undefined') {
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'nhh_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'nhh_user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'nhh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    }
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const fetchMetrics = async (env: Environment) => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch(`/api/monitor?env=${env}`);
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch('/api/oauth/clients');
      const json = await res.json();
      if (json.success && json.clients) {
        setClients(json.clients);
      }
    } catch (err) {
      console.error('Fetch clients error:', err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMetrics(environment);
      fetchClients();
    }
  }, [environment, currentUser]);

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientRedirect) return;
    setIsRegisteringClient(true);
    setRegisterSuccessMsg(null);
    try {
      const res = await fetch('/api/oauth/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          description: newClientDesc,
          redirectUris: [newClientRedirect.trim()],
          isTrusted: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewClientName('');
        setNewClientDesc('');
        setNewClientRedirect('');
        setRegisterSuccessMsg(`ลงทะเบียนสำเร็จ: ${data.client.name} (Client ID: ${data.client.clientId})`);
        fetchClients();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRegisteringClient(false);
    }
  };

  const startEdit = (client: any) => {
    setEditingClient(client);
    setEditName(client.name || '');
    setEditDesc(client.description || '');
    setEditRedirects((client.redirectUris || []).join('\n'));
    setEditError(null);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName.trim()) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const uris = editRedirects
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      if (uris.length === 0) {
        setEditError('ต้องระบุอย่างน้อย 1 Redirect URI (Callback URL)');
        setIsSavingEdit(false);
        return;
      }

      const res = await fetch('/api/oauth/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: editingClient.clientId,
          name: editName.trim(),
          description: editDesc.trim(),
          redirectUris: uris,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingClient(null);
        setClients((prev) => prev.map((c) => c.clientId === editingClient.clientId ? data.client : c));
        await fetchClients();
      } else {
        setEditError(data.error || 'บันทึกการแก้ไขไม่สำเร็จ');
      }
    } catch (err: any) {
      setEditError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    const targetId = deletingClient.clientId;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/oauth/clients?client_id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeletingClient(null);
        setClients((prev) => prev.filter((c) => c.clientId !== targetId));
        await fetchClients();
      } else {
        alert(data.error || 'ลบไม่สำเร็จ');
      }
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (keyId: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleRunApiTest = async (provider: 'PROVIDER_ID' | 'HEALTH_ID') => {
    setIsTestingApi(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/auth/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment,
          provider,
          hospitalCode: NHH_AUTH_CONFIG.hospitalCode,
          serviceName: NHH_AUTH_CONFIG.serviceName,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      fetchMetrics(environment);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: { message: err?.message || 'Failed to call API' },
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Active Credentials: PRD Production Only
  const currentHealthId = NHH_AUTH_CONFIG.healthId.prd;
  const currentProviderId = NHH_AUTH_CONFIG.providerId.prd;

  // 1. Loading Check State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>กำลังตรวจสอบสิทธิ์การใช้งาน...</span>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Guard Screen: If not logged in, block access!
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FBFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
        {/* Simple Header */}
        <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800">
              <Image src="/nhh.png" alt="Logo รพ.หนองหาน" width={32} height={32} className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                ระบบยืนยันตัวตนกลาง
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                รพ.หนองหาน [11018]
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        {/* Access Denied / Login Required Box */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/80 dark:border-red-900">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>จำกัดสิทธิ์การเข้าถึง</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                เข้าสู่ระบบก่อน ถึงจะใช้งานหลังบ้านได้
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                ระบบหลังบ้านนี้จำกัดสิทธิ์เฉพาะบุคลากรของ <strong>โรงพยาบาลหนองหาน [11018]</strong> ที่ผ่านการยืนยันตัวตนด้วย <strong>Provider ID</strong> กระทรวงสาธารณสุข เท่านั้น
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href="/api/auth/provider-id"
                className="group relative flex items-center w-full p-2.5 pr-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 transition-all duration-300 shadow-lg shadow-emerald-700/25 active:scale-[0.98] text-left"
              >
                <div className="relative z-10 w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm mr-3 shrink-0">
                  <Image
                    src="/providerid.png"
                    width={30}
                    height={30}
                    className="object-contain"
                    alt="Provider ID Logo"
                  />
                </div>
                <div className="relative z-10 flex-1">
                  <span className="block text-sm font-bold text-white tracking-tight drop-shadow-sm">
                    เข้าสู่ระบบด้วย Provider ID
                  </span>
                  <span className="block text-[10px] text-emerald-100 font-medium">
                    MOPH Health ID • ยืนยันตัวตนบุคลากร รพ.หนองหาน [11018]
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/"
                className="w-full py-3 px-4 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>กลับสู่หน้าหลัก</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Authenticated: Render Backend Console
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFA] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Top Bar matching Image 2 */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800">
                <Image src="/nhh.png" alt="Logo รพ.หนองหาน" width={32} height={32} className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                  ระบบยืนยันตัวตนกลาง
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  รพ.หนองหาน [11018]
                </span>
              </div>
            </Link>

            {/* Top Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                  activeTab === 'overview'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                ภาพรวม (ระบบงาน)
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                ข้อมูล Provider ID / บัญชีบุคลากร
                {activeTab === 'profile' && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('oauth-idp')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                  activeTab === 'oauth-idp'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                OAuth 2.0 IdP & Clients
                {activeTab === 'oauth-idp' && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>

              {currentUser?.isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('api-monitor')}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                      activeTab === 'api-monitor'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    API & Monitor
                    {activeTab === 'api-monitor' && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('credentials')}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors relative ${
                      activeTab === 'credentials'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Health ID & Provider ID
                    {activeTab === 'credentials' && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* User Profile Pill (Click to open Provider ID Profile) */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity text-left"
              title="ดูข้อมูล Provider ID และบัญชีบุคลากร"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800">
                {currentUser?.avatarChar || 'น'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                  {currentUser?.fullName}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  {currentUser?.isAdmin ? (
                    <span className="font-bold text-amber-700 dark:text-amber-400">👑 ผู้ดูแลระบบ (Admin)</span>
                  ) : (
                    <span>ผู้ใช้งานทั่วไป</span>
                  )}
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Sidebar + Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          {/* User Card (Click to open Provider ID Profile) */}
          <div
            onClick={() => setActiveTab('profile')}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            title="คลิกเพื่อดูข้อมูล Provider ID และบัญชีบุคลากร"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-lg flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              {currentUser?.avatarChar || 'น'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser?.fullName}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {currentUser?.hospitalName || 'รพ.หนองหาน'} [{currentUser?.hospitalCode || '11018'}]
              </p>
            </div>
          </div>

          {/* Sidebar Nav */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-2 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ภาพรวม (ระบบงาน)</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ข้อมูล Provider ID / บุคลากร</span>
            </button>

            <button
              onClick={() => setActiveTab('oauth-idp')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'oauth-idp'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Share2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>OAuth 2.0 IdP & Clients</span>
            </button>

            {currentUser?.isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('api-monitor')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'api-monitor'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>API & Monitor</span>
                </button>

                <button
                  onClick={() => setActiveTab('credentials')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'credentials'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Health ID & Provider ID</span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'logs'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span>บันทึกการเรียกใช้งาน</span>
                </button>
              </>
            )}
          </div>

          {/* Hospital Info Box */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/60 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
              <Building2 className="w-4 h-4" />
              <span>หน่วยบริการที่ลงทะเบียน</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              <strong>โรงพยาบาลหนองหาน</strong>
              <br />
              รหัสหน่วยบริการ: <strong>11018</strong>
              <br />
              Service: <strong>Super App By รพ.หนองหาน</strong>
            </p>
          </div>

          {/* Logout Button in Sidebar */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 hover:border-red-200 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: ภาพรวม (Overview) — ศูนย์รวมระบบงานและแอปพลิเคชันทั้งหมดเท่านั้น */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5 tracking-tight">
                    <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <span>ระบบงานและแอปพลิเคชันทั้งหมดในโรงพยาบาล [11018] ({clients.length})</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    ศูนย์กลางระบบงานสารสนเทศ เวชระเบียน และบริการดิจิทัลทั้งหมดของโรงพยาบาลหนองหานที่รองรับการยืนยันตัวตน SSO
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('oauth-idp')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>ลงทะเบียนแอปใหม่</span>
                </button>
              </div>

              {/* Connected Hospital Applications Section - Enhanced & Beautiful Grid */}
              <div className="space-y-4">

                {clients.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
                      <Share2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {currentUser?.isAdmin
                          ? 'ยังไม่มีแอปพลิเคชันที่ลงทะเบียนในระบบ'
                          : 'ท่านยังไม่มีแอปพลิเคชันของตนเองที่ลงทะเบียนไว้'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                        เริ่มต้นเชื่อมต่อระบบงานภายในโรงพยาบาล เพื่อให้บุคลากรสามารถล็อกอินผ่าน Provider ID ได้ทันที
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('oauth-idp')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ลงทะเบียนแอปพลิเคชันใหม่</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((app: any, idx: number) => {
                      // สุ่มโทนสีไอคอนและการ์ดให้ดูมีชีวิตชีวาและแยกแยะง่าย
                      const iconStyles = [
                        'from-emerald-500 to-teal-600 shadow-emerald-500/20 text-white',
                        'from-blue-500 to-indigo-600 shadow-blue-500/20 text-white',
                        'from-teal-500 to-cyan-600 shadow-teal-500/20 text-white',
                        'from-violet-500 to-purple-600 shadow-violet-500/20 text-white',
                        'from-amber-500 to-orange-600 shadow-amber-500/20 text-white',
                      ];
                      const iconStyle = iconStyles[idx % iconStyles.length];

                      return (
                        <div
                          key={app.id || app.clientId}
                          onClick={() => {
                            if (app.redirectUris && app.redirectUris[0]) {
                              let targetUrl = app.redirectUris[0];
                              try {
                                const u = new URL(targetUrl);
                                targetUrl = u.origin;
                              } catch {}
                              window.open(targetUrl, '_blank');
                            }
                          }}
                          className="group relative bg-white dark:bg-zinc-900/90 hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/40 dark:hover:to-emerald-950/30 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                        >
                          <div className="space-y-3.5">
                            {/* Card Header: Icon + Badge + Open Link */}
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${iconStyle} shadow-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                              >
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shrink-0 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  พร้อมใช้งาน
                                </span>
                                <div className="p-1 rounded-lg text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 transition-colors" title="เปิดระบบงานนี้">
                                  <ExternalLink className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* Title (Full Name, No Truncate) & Description */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug break-words">
                                {app.name}
                              </h4>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
                                {app.description || 'ระบบงานเชื่อมต่อการยืนยันตัวตนกลาง SSO รพ.หนองหาน [11018]'}
                              </p>
                            </div>

                            {/* Client ID Pill (Click-to-Copy without triggering card link) */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400"
                            >
                              <span className="truncate max-w-[200px]">{app.clientId}</span>
                              <button
                                onClick={() => handleCopy(app.clientId, `app-cid-${app.clientId}`)}
                                className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-1 shrink-0 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                title="คัดลอก Client ID"
                              >
                                {copiedKey === `app-cid-${app.clientId}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Footer Info & Quick Link Button */}
                          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1 truncate max-w-[170px]">
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                {app.createdByName ? `โดย: ${app.createdByName}` : 'ระบบส่วนกลาง รพ.หนองหาน'}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                              <span>เข้าสู่ระบบงาน</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick API Live Result Preview if tested (Admin Only) */}
              {currentUser?.isAdmin && testResult && (
                <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-4 font-mono text-xs space-y-2 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-semibold text-emerald-400">ผลการทดสอบ API Token:</span>
                    <span>สถานะ: 200 OK</span>
                  </div>
                  <pre className="overflow-x-auto p-2 bg-black/50 rounded-lg text-emerald-300 text-[11px]">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB: ข้อมูล Provider ID และบัญชีบุคลากร */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                  <Fingerprint className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <span>ข้อมูล Provider ID และบัญชีบุคลากร</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  ข้อมูลบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง และการเชื่อมโยง Provider ID ของฉัน สังกัดโรงพยาบาลหนองหาน [11018]
                </p>
              </div>

              {/* User Profile Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-inner">
                    {currentUser?.avatarChar || (currentUser?.fullName ? currentUser.fullName.charAt(0) : 'น')}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {currentUser?.fullName}
                      </h2>
                      {currentUser?.isAdmin ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                          <span>👑</span>
                          <span>ผู้ดูแลระบบ (Admin)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          ผู้ใช้งานทั่วไป
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {currentUser?.hospitalName || 'โรงพยาบาลหนองหาน'} [{currentUser?.hospitalCode || '11018'}] • {currentUser?.position || 'บุคลากรทางการแพทย์'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ยืนยันตัวตนแล้ว (Verified)
                  </span>
                </div>
              </div>

              {/* Connected Account Section: Position & Affiliated Hospital */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  รายละเอียดการเชื่อมโยงระบบสาธารณสุข
                </h3>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                          หน่วยบริการสังกัด
                        </span>
                        <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-0.5">
                          {currentUser?.hospitalName || 'โรงพยาบาลหนองหาน'} [{currentUser?.hospitalCode || '11018'}]
                        </strong>
                        <span className="text-xs text-zinc-500">จังหวัดอุดรธานี • เขตสุขภาพที่ 8</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                          ตำแหน่ง / บทบาทหน้าที่
                        </span>
                        <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-0.5">
                          {currentUser?.position || 'บุคลากรทางการแพทย์'}
                        </strong>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">สิทธิ์เข้าถึง: บุคลากรทางการแพทย์ รพ.หนองหาน</span>
                      </div>
                    </div>
                  </div>

                  {/* Provider ID Card Details */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Fingerprint className="w-4 h-4 text-emerald-600" />
                      <span>
                        เชื่อมโยง Provider ID หน่วยบริการ: <strong>โรงพยาบาลหนองหาน [11018]</strong>
                      </span>
                    </div>

                    {currentUser?.isAdmin && (
                      <button
                        onClick={() => handleRunApiTest('PROVIDER_ID')}
                        disabled={isTestingApi}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isTestingApi ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ API (PRD)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Access Denied Card if non-admin attempts to view admin tab */}
          {!currentUser?.isAdmin && activeTab !== 'overview' && activeTab !== 'profile' && activeTab !== 'oauth-idp' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-amber-200 dark:border-amber-900/60 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                เมนูนี้เปิดให้เข้าถึงเฉพาะผู้ดูแลระบบ (เลขประจำตัวประชาชน 1439900002681) เท่านั้น บุคลากรทั่วไปสามารถเข้าถึงได้เฉพาะหน้าภาพรวมและเมนู OAuth 2.0 IdP จัดการแอปของตนเอง
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
              >
                กลับสู่หน้าภาพรวม
              </button>
            </div>
          )}

          {/* TAB 2: API & Monitor (Super App By รพ.หนองหาน - Admin Only) */}
          {currentUser?.isAdmin && activeTab === 'api-monitor' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    API & System Monitor
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Service: <strong>Super App By รพ.หนองหาน</strong> • รหัสหน่วยบริการ <strong>11018</strong>
                  </p>
                </div>

                <button
                  onClick={() => fetchMetrics(environment)}
                  disabled={isLoadingMetrics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                  <span>รีเฟรชข้อมูล</span>
                </button>
              </div>

              {/* Status Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">สถานะระบบ</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ONLINE
                  </p>
                  <p className="text-[11px] text-zinc-400">ระบบใช้งานจริง (PRD)</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">ความเร็วตอบสนอง (Latency)</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {metrics && metrics.averageLatencyMs > 0 ? `${metrics.averageLatencyMs} ms` : 'พร้อมวัดผล'}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {metrics && metrics.averageLatencyMs > 0
                      ? (metrics.averageLatencyMs < 200 ? 'ความเร็วอยู่ในเกณฑ์ดีเยี่ยม' : 'ความเร็วปกติ')
                      : 'รอคำขอแรก'}
                  </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">ความสำเร็จของ API</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {metrics?.successRate !== undefined ? `${metrics.successRate}%` : '100%'}
                  </p>
                  <p className="text-[11px] text-zinc-400">Uptime: {metrics?.uptimePercentage ?? 100}%</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">คำขอวันนี้ (Requests)</span>
                    <Server className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {metrics?.totalRequestsToday !== undefined ? metrics.totalRequestsToday.toLocaleString() : '0'}
                  </p>
                  <p className="text-[11px] text-zinc-400">คำขอใช้งานจริงวันนี้</p>
                </div>
              </div>

              {/* Active API Endpoints List */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Active API Endpoints (Super App By รพ.หนองหาน)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunApiTest('PROVIDER_ID')}
                      disabled={isTestingApi}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white transition-all shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isTestingApi ? 'กำลังทดสอบจริงกับ สธ....' : 'ทดสอบ Live Request'}</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-mono">
                  {(metrics?.activeEndpoints || []).map((ep: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${ep.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                          {ep.method}
                        </span>
                        <div>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ep.path}</span>
                          <span className="text-zinc-400 font-sans ml-2 text-[11px]">({ep.name})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">
                          {ep.latencyMs > 0 ? `${ep.latencyMs}ms` : '-'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {ep.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Health ID & Provider ID Credentials (เอกสารส่วนที่ 1 & 2 - Admin Only) */}
          {currentUser?.isAdmin && activeTab === 'credentials' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Client ID และ Secret Key สำหรับเอกสารเชื่อมต่อ
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  หน่วยบริการ: <strong>โรงพยาบาลหนองหาน [11018]</strong> • ชื่อ Service: <strong>Super App By รพ.หนองหาน</strong>
                </p>
              </div>

              {/* ส่วนที่ 1: Health ID */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        ส่วนที่ 1: ข้อมูล Health ID
                      </h2>
                      <p className="text-xs text-zinc-400">สำหรับใช้ในเอกสาร ส่วนที่ 1 (ระบบกระทรวงสาธารณสุข)</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ระบบใช้งานจริง (Production)
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Client ID */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Client ID (Production)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentHealthId.clientId}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(currentHealthId.clientId, 'health-id-client-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="คัดลอก Client ID"
                      >
                        {copiedKey === 'health-id-client-prd' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Secret Key (Production)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={visibleSecrets['health-prd'] ? 'text' : 'password'}
                        readOnly
                        value={currentHealthId.secretKey}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => toggleSecret('health-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="แสดง/ซ่อนคีย์"
                      >
                        {visibleSecrets['health-prd'] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(currentHealthId.secretKey, 'health-id-secret-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="คัดลอก Secret Key"
                      >
                        {copiedKey === 'health-id-secret-prd' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 2: Provider ID */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        ส่วนที่ 2: ข้อมูล Provider ID
                      </h2>
                      <p className="text-xs text-zinc-400">สำหรับใช้ในเอกสาร ส่วนที่ 2 (ระบบยืนยันตัวตนบุคลากร)</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ระบบใช้งานจริง (Production)
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Client ID */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Client ID (Production)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentProviderId.clientId}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(currentProviderId.clientId, 'provider-id-client-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="คัดลอก Client ID"
                      >
                        {copiedKey === 'provider-id-client-prd' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Secret Key (Production)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={visibleSecrets['provider-prd'] ? 'text' : 'password'}
                        readOnly
                        value={currentProviderId.secretKey}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => toggleSecret('provider-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="แสดง/ซ่อนคีย์"
                      >
                        {visibleSecrets['provider-prd'] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(currentProviderId.secretKey, 'provider-id-secret-prd')}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors"
                        title="คัดลอก Secret Key"
                      >
                        {copiedKey === 'provider-id-secret-prd' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Logs (Admin Only) */}
          {currentUser?.isAdmin && activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ประวัติการเรียกใช้งาน (Audit & Activity Logs)
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  รายการทำรายการผ่าน API Gateway • รพ.หนองหาน [11018]
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-sans border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-2.5 px-3">เวลา</th>
                        <th className="py-2.5 px-3">Endpoint</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                        <th className="py-2.5 px-3">เวลาตอบสนอง</th>
                        <th className="py-2.5 px-3">Environment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {(!metrics?.recentLogs || metrics.recentLogs.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400 font-sans">
                            ยังไม่มีประวัติการเรียกใช้งาน (ระบบจะบันทึกอัตโนมัติเมื่อมีการเรียกใช้ API จริง)
                          </td>
                        </tr>
                      ) : (
                        metrics.recentLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <td className="py-3 px-3 text-zinc-500">{log.timestamp}</td>
                            <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              {log.endpoint}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px]">
                                {log.method}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.statusCode < 400 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                                {log.statusCode} {log.status || (log.statusCode < 400 ? 'OK' : 'ERROR')}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-500">{log.responseTimeMs} ms</td>
                            <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">
                              {log.environment}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OAuth 2.0 IdP & Clients */}
          {activeTab === 'oauth-idp' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                    <Share2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {currentUser?.isAdmin
                        ? 'OAuth 2.0 Identity Provider (IdP) & Client Apps'
                        : 'OAuth 2.0 Identity Provider (IdP) • แอปพลิเคชันของฉัน'}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {currentUser?.isAdmin
                      ? 'ศูนย์กลางให้บริการยืนยันตัวตนกลาง (SSO IdP) สำหรับระบบงานภายในโรงพยาบาลหนองหาน [11018]'
                      : 'ลงทะเบียนและจัดการระบบงาน / แอปพลิเคชันของท่าน เพื่อเชื่อมต่อระบบยืนยันตัวตน SSO'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchClients}
                    disabled={isLoadingClients}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-colors"
                    title="รีเฟรชรายชื่อแอป"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClients ? 'animate-spin' : ''}`} />
                    <span>รีเฟรชรายชื่อแอป</span>
                  </button>
                </div>
              </div>

              {/* IdP System Endpoints Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-800">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      Standard OIDC / OAuth 2.0 Endpoints
                    </h2>
                    <p className="text-xs text-zinc-400">
                      URL มาตรฐานสำหรับให้นักพัฒนานำไปใส่ในแอปพลิเคชันลูกข่าย (Clients) เพื่อเชื่อมต่อ SSO
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      1. OpenID Connect Discovery URL
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                        /.well-known/openid-configuration
                      </code>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/.well-known/openid-configuration`, 'oidc-disc')}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="คัดลอก"
                      >
                        {copiedKey === 'oidc-disc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      2. Authorization Endpoint (หน้ายินยอมสิทธิ์)
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                        /oauth/authorize
                      </code>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/oauth/authorize`, 'auth-ep')}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="คัดลอก"
                      >
                        {copiedKey === 'auth-ep' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      3. Token Endpoint (แลก Access Token)
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                        /api/oauth/token
                      </code>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/api/oauth/token`, 'token-ep')}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="คัดลอก"
                      >
                        {copiedKey === 'token-ep' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      4. UserInfo Endpoint (ดึงข้อมูลผู้ใช้ที่ตรวจสอบแล้ว)
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold break-all">
                        /api/oauth/userinfo
                      </code>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/api/oauth/userinfo`, 'userinfo-ep')}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="คัดลอก"
                      >
                        {copiedKey === 'userinfo-ep' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Client Apps List */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-indigo-500" />
                      <span>
                        {`รายการ Client Applications ทั้งหมดในระบบ (${clients.length} แอป)`}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ระบบและแอปพลิเคชันทั้งหมดที่เชื่อมต่อ SSO ใน รพ.หนองหาน (คุณสามารถแก้ไข/ลบเฉพาะแอปที่ตนเองเป็นเจ้าของ หรือสิทธิ์ Admin)
                    </p>
                  </div>
                </div>

                {isLoadingClients ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>กำลังโหลดรายชื่อแอปพลิเคชัน...</span>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <p>ยังไม่มีแอปพลิเคชันลงทะเบียนในระบบ สามารถลงทะเบียนได้ที่แบบฟอร์มด้านล่าง</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((app: any) => (
                      <div
                        key={app.id || app.clientId}
                        className="p-4 sm:p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {app.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Trusted App
                              </span>
                              {app.canEdit && !currentUser?.isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                  แอปของคุณ
                                </span>
                              )}
                            </div>
                            {app.description && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {app.description}
                              </p>
                            )}
                            {app.createdByName && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                                <span>👤 สร้างโดย:</span>
                                <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{app.createdByName}</strong>
                                {currentUser?.isAdmin && app.createdByCid ? (
                                  <span className="text-zinc-400 font-mono">(CID: {app.createdByCid})</span>
                                ) : null}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: แก้ไข & ลบ — เฉพาะเจ้าของหรือ Admin เท่านั้น */}
                          {app.canEdit ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => startEdit(app)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 transition-all shadow-2xs"
                                title="แก้ไขข้อมูลแอปพลิเคชัน"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>แก้ไข</span>
                              </button>

                              <button
                                onClick={() => setDeletingClient(app)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-red-300 transition-all shadow-2xs"
                                title="ลบแอปพลิเคชัน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shrink-0">
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>เฉพาะเจ้าของหรือ Admin แก้ไขได้</span>
                            </div>
                          )}
                        </div>

                        {/* Client ID & Secret Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                              Client ID
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={app.clientId}
                                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                              />
                              <button
                                onClick={() => handleCopy(app.clientId, `cid-${app.clientId}`)}
                                className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300"
                                title="คัดลอก Client ID"
                              >
                                {copiedKey === `cid-${app.clientId}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                              Client Secret
                            </label>
                            {app.canEdit ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type={visibleSecrets[app.clientId] ? 'text' : 'password'}
                                  readOnly
                                  value={app.clientSecret || '••••••••••••••••'}
                                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                                />
                                <button
                                  onClick={() => toggleSecret(app.clientId)}
                                  className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300"
                                  title="แสดง/ซ่อนคีย์"
                                >
                                  {visibleSecrets[app.clientId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                {app.clientSecret && (
                                  <button
                                    onClick={() => handleCopy(app.clientSecret, `csec-${app.clientId}`)}
                                    className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300"
                                    title="คัดลอก Client Secret"
                                  >
                                    {copiedKey === `csec-${app.clientId}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="password"
                                  readOnly
                                  value="••••••••••••••••"
                                  className="flex-1 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                                />
                                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1 shrink-0">
                                  🔒 ซ่อนคีย์ลับ
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Allowed Redirect URIs */}
                        <div className="pt-1">
                          <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                            Redirect URIs ที่อนุญาต (Callback URLs)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(app.redirectUris || []).map((uri: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
                              >
                                {uri}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Register New Client Form */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    ลงทะเบียนแอปพลิเคชันใหม่ (Register New Client App)
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  เพิ่มระบบงานหรือโปรแกรมใหม่ในโรงพยาบาล ให้สามารถล็อกอินผ่าน SSO ได้
                </p>

                {registerSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{registerSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterClient} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        ชื่อระบบ / แอปพลิเคชัน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ระบบคิวผู้ป่วยนอก (Queue App)"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        คำอธิบายสั้นๆ
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ระบบแสดงผลคิวตรวจของ รพ.หนองหาน"
                        value={newClientDesc}
                        onChange={(e) => setNewClientDesc(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Redirect URI (Callback URL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="เช่น http://localhost:4000/api/auth/callback หรือ https://queue.nhh.go.th/callback"
                      value={newClientRedirect}
                      onChange={(e) => setNewClientRedirect(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isRegisteringClient || !newClientName || !newClientRedirect}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                      {isRegisteringClient ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>ลงทะเบียน Client ใหม่</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: แก้ไขแอปพลิเคชัน (Edit Client Modal) */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    แก้ไขแอปพลิเคชัน
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Client ID: {editingClient.clientId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  ชื่อระบบ / แอปพลิเคชัน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  คำอธิบาย
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Redirect URIs ที่อนุญาต (Callback URLs) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-zinc-400 mb-1.5">
                  ระบุ URL ที่อนุญาตให้รับ Token หลังล็อกอิน (ใส่บรรทัดละ 1 URL)
                </p>
                <textarea
                  rows={4}
                  required
                  value={editRedirects}
                  onChange={(e) => setEditRedirects(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>บันทึกการแก้ไข</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลบแอปพลิเคชัน (Delete Confirm Modal) */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  ยืนยันการลบแอปพลิเคชัน
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  คุณต้องการลบแอปพลิเคชันนี้ออกจากระบบหรือไม่?
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700 space-y-1 text-xs">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {deletingClient.name}
              </p>
              <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Client ID: {deletingClient.clientId}
              </p>
            </div>

            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
              ⚠️ คำเตือน: หากลบแล้ว ระบบนี้จะไม่สามารถส่งผู้ใช้มาล็อกอินผ่าน SSO ได้อีกต่อไป
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingClient(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClient}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ยืนยันลบแอป</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
