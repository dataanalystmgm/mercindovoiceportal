import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { Shield, Key, Mail, UserPlus, LogIn, Briefcase, HelpCircle } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export default function AuthView({ onLoginSuccess, onClose }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [department, setDepartment] = useState('Sales & Marketing');
  const [nik, setNik] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pics, setPics] = useState<any[]>([]);

  useEffect(() => {
    const loadPics = async () => {
      try {
        const response = await fetch('/api/pics');
        if (response.ok) {
          const data = await response.json();
          setPics(data);
        }
      } catch (err) {
        console.error('Failed to pre-fetch PICs:', err);
      }
    };
    loadPics();
  }, []);

  const handleNikChange = (value: string) => {
    setNik(value);
    
    if (value.trim() && pics.length > 0) {
      const cleanVal = value.trim().toLowerCase();
      const matched = pics.find(p => p.nik && p.nik.toString().trim().toLowerCase() === cleanVal);
      if (matched) {
        setRole('pic');
        if (matched.name) {
          setName(matched.name);
        }
        if (matched.section) {
          setDepartment(matched.section);
        }
        setSuccess(`NIK Terverifikasi! Jabatan otomatis diatur ke "Karyawan & Penanggung Jawab" untuk ${matched.name}.`);
        setTimeout(() => setSuccess(''), 5000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password }
      : { email, password, name, role, department, nik };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      if (isLogin) {
        setSuccess('Login berhasil!');
        setTimeout(() => {
          onLoginSuccess(data.user);
          if (onClose) onClose();
        }, 800);
      } else {
        setSuccess('Registrasi berhasil! Silakan login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-2xl shadow-xl border border-natural-beige overflow-hidden w-full max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-natural-deep to-natural-sage p-6 text-white text-center">
        <h3 className="text-xl font-bold font-display">Portal Akun Karyawan</h3>
        <p className="text-[#E6EBE6] text-xs mt-1">
          Daftar atau masuk untuk memantau aspirasi pribadi dan menindaklanjuti program kerja.
        </p>
      </div>

      <div className="p-6">
        {/* Tab selector */}
        <div className="flex border-b border-natural-beige mb-6">
          <button
            id="tab-login"
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              isLogin 
                ? 'border-natural-sage text-natural-sage font-bold' 
                : 'border-transparent text-natural-muted hover:text-natural-deep'
            }`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <span className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              Masuk
            </span>
          </button>
          <button
            id="tab-signup"
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              !isLogin 
                ? 'border-natural-sage text-natural-sage font-bold' 
                : 'border-transparent text-natural-muted hover:text-natural-deep'
            }`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Daftar Akun
            </span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg border border-emerald-100">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">Nama Lengkap</label>
                <div className="relative">
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    placeholder="Contoh: Rian Hidayat"
                    className="w-full px-4 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage focus:border-transparent bg-natural-light/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">NIK (Nomor Induk Karyawan)</label>
                <input
                  id="input-reg-nik"
                  type="text"
                  required
                  placeholder="Contoh: 12345"
                  className="w-full px-4 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage focus:border-transparent bg-natural-light/50 font-mono text-natural-deep"
                  value={nik}
                  onChange={(e) => handleNikChange(e.target.value)}
                />
                <p className="text-[10px] text-natural-sage mt-1">
                  PENTING: Masukkan NIK Anda. Jika NIK Anda cocok dengan PIC terdaftar di Google Sheet, Anda otomatis mendapatkan akses Penanggung Jawab.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">Peran Jabatan (Role)</label>
                <select
                  id="select-reg-role"
                  className="w-full px-3 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage focus:border-transparent bg-white text-natural-deep disabled:bg-gray-100/80 disabled:text-gray-500 disabled:cursor-not-allowed"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={role === 'pic'}
                >
                  <option value="employee">Karyawan (Employee)</option>
                  <option value="compliance">Compliance / Admin</option>
                  <option value="pic">Karyawan & Penanggung Jawab</option>
                </select>
                {role === 'pic' && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                    🔒 Peran terkunci karena NIK Anda terverifikasi sebagai Penanggung Jawab (PIC).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">Departemen</label>
                <input
                  id="input-reg-dept"
                  type="text"
                  placeholder="Contoh: IT Operations, HRD, Sales, Finance"
                  className="w-full px-4 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage focus:border-transparent bg-natural-light/50"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Email Perusahaan - requested if Login, OR if Register AND Role is Karyawan & Penanggung Jawab (pic) */}
          {(isLogin || role === 'pic') && (
            <div>
              <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">
                {isLogin ? 'Email Perusahaan atau NIK' : 'Email Perusahaan'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-natural-muted" />
                <input
                  id="input-auth-email"
                  type={isLogin ? "text" : "email"}
                  required
                  placeholder={isLogin ? "email@perusahaan.com atau NIK" : "email@perusahaan.com"}
                  className="w-full pl-10 pr-4 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage bg-natural-light/50 text-natural-deep"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-natural-deep uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-natural-muted" />
              <input
                id="input-auth-pass"
                type="password"
                required
                placeholder="******"
                className="w-full pl-10 pr-4 py-2 border border-natural-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-natural-sage bg-natural-light/50 text-natural-deep"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-natural-sage hover:bg-natural-deep text-white py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 disabled:bg-natural-muted/60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? 'Memproses...' : isLogin ? 'Masuk ke Portal' : 'Daftar Sekarang'}
          </button>
        </form>


      </div>
    </div>
  );
}
