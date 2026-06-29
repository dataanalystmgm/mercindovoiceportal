import React, { useState, useEffect } from 'react';
import SubmitForm from './components/SubmitForm';
import TrackingView from './components/TrackingView';
import PublicBoard from './components/PublicBoard';
import AdminDashboard from './components/AdminDashboard';
import AuthView from './components/AuthView';
import { User } from './types';
import { Shield, Sparkles, MessageSquare, Lightbulb, Users, Lock, LogIn, LogOut, CheckSquare, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'submit' | 'public' | 'track' | 'admin'>('submit');
  const [trackingCodeToQuery, setTrackingCodeToQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load session user if available (can preserve login state for ease of development/testing)
  useEffect(() => {
    const saved = localStorage.getItem('sa_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('sa_user');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sa_user', JSON.stringify(user));
    setShowAuthModal(false);
    
    // Auto redirect to Admin view if compliance or pic
    if (user.role === 'compliance' || user.role === 'pic') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sa_user');
    setActiveTab('submit');
  };

  const handleSelectTrack = (code: string) => {
    setTrackingCodeToQuery(code);
    setActiveTab('track');
  };

  const handleSubmissionSuccess = (code: string, isIdea: boolean) => {
    // autofill tracking field in case they want to check right away
    setTrackingCodeToQuery(code);
  };

  return (
    <div className="min-h-screen bg-natural-bg font-sans flex flex-col text-[#3D3D3D]">
      
      {/* 1. Header Navigation Bar (Matches design mock) */}
      <nav className="h-20 border-b border-natural-border/70 bg-white/70 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 shadow-sm/50">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => setActiveTab('submit')}>
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#2C362F] via-[#405445] to-[#5B7061] rounded-2xl flex items-center justify-center text-white font-black font-display tracking-tight text-sm md:text-base shadow-md border border-[#E0DBCF]/20 ring-2 ring-natural-sage/20 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-natural-sage/40">
              <span className="bg-gradient-to-b from-white via-white to-[#F4F1EC] bg-clip-text text-transparent drop-shadow-sm font-black tracking-widest pl-0.5">MVP</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black tracking-tight font-display text-natural-deep bg-gradient-to-r from-[#2C362F] to-[#405445] bg-clip-text text-transparent group-hover:to-natural-sage transition-all duration-300">
                Mercindo
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-natural-sage -mt-0.5 md:-mt-1 font-display">
              Voice Portal
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Desktop Only) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            id="nav-tab-submit"
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`px-2 py-1.5 rounded-lg transition-colors ${
              activeTab === 'submit' 
                ? 'text-natural-deep font-bold bg-natural-light' 
                : 'text-natural-sage hover:text-natural-deep'
            }`}
          >
            Aspirasi Baru
          </button>
          
          <button
            id="nav-tab-public"
            type="button"
            onClick={() => setActiveTab('public')}
            className={`px-2 py-1.5 rounded-lg transition-colors ${
              activeTab === 'public' 
                ? 'text-natural-deep font-bold bg-natural-light' 
                : 'text-natural-sage hover:text-natural-deep'
            }`}
          >
            Board Publik
          </button>

          <button
            id="nav-tab-track"
            type="button"
            onClick={() => setActiveTab('track')}
            className={`px-2 py-1.5 rounded-lg transition-colors ${
              activeTab === 'track' 
                ? 'text-natural-deep font-bold bg-natural-light' 
                : 'text-natural-sage hover:text-natural-deep'
            }`}
          >
            Lacak Kode
          </button>

          {/* Admin Dashboard Tab (Only shown if logged in with Admin/Compliance/PIC status) */}
          {currentUser && (currentUser.role === 'compliance' || currentUser.role === 'pic') && (
            <button
              id="nav-tab-admin"
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors bg-indigo-50 border border-indigo-100 flex items-center gap-1 ${
                activeTab === 'admin' 
                  ? 'text-indigo-900 bg-indigo-100' 
                  : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tindak Lanjut Admin
            </button>
          )}
        </div>

        {/* Login/Logout Profile controls (Compact on mobile) */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 md:pl-2 md:border-l md:border-natural-border">
              <span className="hidden md:inline-block text-xs text-natural-deep font-semibold">
                {currentUser.name}
              </span>
              <button
                id="btn-nav-logout"
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-login"
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 bg-natural-sage text-white text-xs font-bold rounded-full hover:bg-natural-deep transition"
            >
              Sign Up / Login
            </button>
          )}
        </div>
      </nav>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-natural-border/60 px-3 py-2 rounded-2xl shadow-xl flex items-center justify-around w-[92%] max-w-[420px] md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('submit')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'submit' 
              ? 'text-natural-deep font-bold bg-natural-light' 
              : 'text-natural-muted hover:text-natural-deep'
          }`}
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold tracking-tight">Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('public')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'public' 
              ? 'text-natural-deep font-bold bg-natural-light' 
              : 'text-natural-muted hover:text-natural-deep'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold tracking-tight">Board</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('track')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'track' 
              ? 'text-natural-deep font-bold bg-natural-light' 
              : 'text-natural-muted hover:text-natural-deep'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[9px] font-semibold tracking-tight">Lacak</span>
        </button>

        {currentUser && (currentUser.role === 'compliance' || currentUser.role === 'pic') && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'admin' 
                ? 'text-indigo-900 font-bold bg-indigo-50 border border-indigo-100/50' 
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold tracking-tight">Admin</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* TAB 1: Submit Form (Grid layout inspired by design HTML) */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (8 units): Submit Form */}
            <div className="lg:col-span-7">
              <SubmitForm
                currentUser={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
                onSubmissionSuccess={handleSubmissionSuccess}
              />
            </div>

            {/* Right Column (5 units): Fast search & beautiful privacy statement card */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Quick Code tracking widget */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-natural-beige">
                <h4 className="text-sm font-bold text-natural-deep mb-1">Sudah mengajukan sebelumnya?</h4>
                <p className="text-xs text-natural-muted mb-4">Lacak perkembangan respon dan disposisi dari PIC.</p>
                <div className="flex gap-2">
                  <input
                    id="input-quick-track"
                    type="text"
                    placeholder="Contoh: ASP-9281-XYZ"
                    className="flex-1 px-3 py-2 rounded-xl bg-natural-light border-transparent text-xs font-mono uppercase focus:outline-none"
                    value={trackingCodeToQuery}
                    onChange={(e) => setTrackingCodeToQuery(e.target.value)}
                  />
                  <button
                    id="btn-quick-track-go"
                    type="button"
                    onClick={() => {
                      if (trackingCodeToQuery.trim()) {
                        setActiveTab('track');
                      }
                    }}
                    className="p-2.5 bg-natural-sage hover:bg-natural-deep text-white rounded-xl transition"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Your Privacy is Our Priority Card (Matching mock exactly) */}
              <div className="bg-natural-deep rounded-3xl p-6 flex flex-col justify-between text-white space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#3D4B41] rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-natural-moss" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-base font-semibold">Privasi Anda Prioritas Kami.</h3>
                    <p className="text-[#8A968D] text-xs leading-relaxed mt-1">
                      Semua laporan kritik & saran dilindungi dengan ketat. Hanya tim Kepatuhan (Compliance) terdaftar yang dapat mengkaji sumber pengirim demi kenyamanan bekerja tanpa cemas.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#3D4B41]">
                  <span className="text-[10px] font-bold text-natural-muted uppercase">Status Layanan AI</span>
                  <div className="flex gap-1 items-end">
                    <div className="w-1 h-3 bg-natural-moss rounded-full"></div>
                    <div className="w-1 h-5 bg-natural-moss rounded-full"></div>
                    <div className="w-1 h-2 bg-natural-moss rounded-full"></div>
                    <div className="w-1 h-4 bg-natural-moss rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Guidelines helper */}
              <div className="bg-[#E6E2D8] rounded-2xl p-6 border border-natural-border text-xs space-y-3">
                <h4 className="font-bold text-natural-deep">Panduan Pengajuan:</h4>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li><strong>Kritik & Saran</strong>: Diinvestigasi oleh Compliance dan ditunjuk PIC dalam 1x24 jam.</li>
                  <li><strong>Ide Baru</strong>: Diklasifikasi AI. Jika terbukti orisinal, Anda berhak login untuk klaim point inovasi.</li>
                  <li><strong>Status Transparansi</strong>: Berhak dipantau bertahap sampai level Top Management.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Public Board */}
        {activeTab === 'public' && (
          <PublicBoard onSelectTrack={handleSelectTrack} />
        )}

        {/* TAB 3: Tracking View */}
        {activeTab === 'track' && (
          <TrackingView initialCode={trackingCodeToQuery} />
        )}

        {/* TAB 4: Admin / Compliance Work dashboard */}
        {activeTab === 'admin' && currentUser && (
          <AdminDashboard currentUser={currentUser} />
        )}

      </main>

      {/* Auth View Modal dialog overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <button
              id="btn-close-auth-modal"
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200 font-bold text-lg z-10 bg-black/20 hover:bg-black/40 w-6 h-6 rounded-full flex items-center justify-center"
            >
              ×
            </button>
            <AuthView onLoginSuccess={handleLogin} onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Small subtle footer */}
      <footer className="border-t border-natural-border mt-12 py-6 text-center text-[11px] text-natural-muted">
        <p>© 2026 Voicely Internal - Platform Aspirasi Terintegrasi AI Perusahaan. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

// Simple internal icon component to avoid bundle import issues if lucide fails
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
