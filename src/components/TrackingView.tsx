import React, { useState } from 'react';
import { Aspirasi, ProgressStatus } from '../types';
import { Search, MapPin, Calendar, User, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ShieldCheck, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import { getGoogleDriveDirectUrl } from '../utils';

interface TrackingViewProps {
  initialCode?: string;
}

const statusSteps: { status: ProgressStatus; label: string; desc: string }[] = [
  { status: 'submitted', label: 'Diajukan', desc: 'Diterima sistem & diklasifikasi AI' },
  { status: 'reviewed', label: 'Compliance Review', desc: 'Ditinjau kelayakan publikasi' },
  { status: 'in_progress', label: 'Tindak Lanjut PIC', desc: 'Diproses departemen penanggung jawab' },
  { status: 'management', label: 'Top Management', desc: 'Ditinjau oleh Direksi / Manajemen Puncak' },
  { status: 'resolved', label: 'Selesai', desc: 'Aspirasi sukses diselesaikan' }
];

const getTopicBadgeStyle = (topic: string) => {
  const t = (topic || '').toLowerCase();
  if (t.includes('fasilitas')) return 'bg-sky-50 text-sky-700 border border-sky-200';
  if (t.includes('hubungan')) return 'bg-violet-50 text-violet-700 border border-violet-200';
  if (t.includes('lingkungan kerja') || t.includes('lingkungan_kerja')) return 'bg-teal-50 text-teal-700 border border-teal-200';
  if (t.includes('happiness') || t.includes('bahagia')) return 'bg-pink-50 text-pink-700 border border-pink-200';
  if (t.includes('peraturan') || t.includes('kebijakan')) return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (t.includes('harassment') || t.includes('sexual')) return 'bg-red-50 text-red-700 border border-red-200';
  if (t.includes('standar')) return 'bg-slate-100 text-slate-700 border border-slate-300';
  
  if (t.includes('produktivitas')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (t.includes('quality') || t.includes('mutu')) return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (t.includes('management') || t.includes('manajemen') || t.includes('system')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (t.includes('5s')) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (t.includes('human') || t.includes('orang')) return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  if (t.includes('environment')) return 'bg-lime-50 text-lime-700 border border-lime-200';
  
  return 'bg-gray-50 text-gray-600 border border-gray-200';
};

export default function TrackingView({ initialCode = '' }: TrackingViewProps) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Aspirasi | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan kode pelacakan terlebih dahulu');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    Swal.fire({
      title: 'Melacak Kasus...',
      text: 'Sedang mengambil detail data aspirasi dari database...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch(`/api/aspirasi/track/${code.trim()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kode pelacakan tidak ditemukan');
      }

      setData(result);
      Swal.close();
    } catch (err: any) {
      const errMsg = err.message || 'Laporan tidak ditemukan. Periksa kembali kode Anda.';
      setError(errMsg);
      Swal.fire({
        icon: 'error',
        title: 'Pelacakan Gagal',
        text: errMsg
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setLoading(true);
      Swal.fire({
        title: 'Memuat Kode Otomatis...',
        text: 'Mengambil data pelacakan...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      fetch(`/api/aspirasi/track/${initialCode.trim()}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.error) {
            setError(resData.error);
            Swal.fire({
              icon: 'error',
              title: 'Gagal Memuat',
              text: resData.error
            });
          } else {
            setData(resData);
            Swal.close();
          }
        })
        .catch(() => {
          setError('Gagal memuat kode pelacakan otomatis');
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Gagal memuat kode pelacakan otomatis'
          });
        })
        .finally(() => setLoading(false));
    }
  }, [initialCode]);

  // Find the index of the current status in statusSteps
  const getCurrentStepIndex = (currentStatus: ProgressStatus) => {
    return statusSteps.findIndex(step => step.status === currentStatus);
  };

  const activeIndex = data ? getCurrentStepIndex(data.status) : -1;

  return (
    <div className="space-y-6">
      {/* Search Widget */}
      <div className="bg-[#E6E2D8] rounded-2xl p-6 border border-natural-border">
        <h4 className="text-sm font-bold text-natural-deep mb-1">Sudah punya kode pelacakan?</h4>
        <p className="text-xs text-natural-muted mb-4">Masukkan kode unik untuk melihat progres tindak lanjut tim compliance & PIC</p>
        
        <form onSubmit={handleTrack} className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="input-track-code"
              type="text"
              placeholder="Contoh: ASP-9281-XYZ"
              className="w-full px-4 py-2.5 rounded-xl bg-white border-transparent text-sm font-mono uppercase focus:ring-2 focus:ring-natural-moss focus:outline-none"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button
            id="btn-track-submit"
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-natural-deep hover:bg-natural-sage text-white text-sm font-bold rounded-xl transition duration-150 flex items-center gap-1.5 disabled:bg-gray-400"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Lacak
          </button>
        </form>

        {error && (
          <p className="text-red-700 text-xs mt-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>

      {/* Case Details & Timeline */}
      {data && (
        <div id="tracking-result-details" className="bg-white rounded-3xl p-8 shadow-sm border border-natural-beige relative overflow-hidden">
          {/* Header Details */}
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-natural-light text-natural-sage rounded-full text-[10px] font-bold uppercase tracking-wider">
                  PELACAKAN AKTIF
                </span>
                {data.isPublic ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3" /> Publik
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-[10px] flex items-center gap-1 font-medium">
                    <EyeOff className="w-3 h-3" /> Privat
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-serif font-medium text-natural-deep mt-2">Kasus: {data.trackingCode}</h2>
              <p className="text-xs text-natural-muted mt-1">Diajukan pada {new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5 text-right">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wide">Hasil Klasifikasi AI</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-semibold text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  AI Detected: {data.aiClassification === 'ide' ? 'IDE & INOVASI' : 'KRITIK / SARAN'}
                </div>
                {data.topic && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getTopicBadgeStyle(data.topic)}`}>
                    Topik: {data.topic}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Original Content */}
          <div className="bg-natural-light/60 border border-natural-beige rounded-2xl p-5 mb-8">
            <h4 className="font-bold text-natural-deep text-sm mb-1.5">{data.title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{data.content}</p>
            
            {data.photoUrl && (
              <div className="mt-4">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-2">Lampiran Foto:</span>
                <a 
                  href={data.photoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-block group overflow-hidden rounded-xl border border-natural-border bg-white p-1 hover:border-natural-sage transition-all max-w-sm"
                >
                  <img 
                    src={getGoogleDriveDirectUrl(data.photoUrl)} 
                    alt="Lampiran Aspirasi" 
                    className="max-h-48 rounded-lg object-contain transition-transform group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback display
                      console.log("No direct display, keep Google Drive fallback link active.");
                    }}
                  />
                  <span className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold block text-center mt-1.5 underline">
                    Buka Gambar di Google Drive
                  </span>
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-natural-border text-[11px] text-natural-muted">
              <User className="w-3.5 h-3.5" />
              <span>Pengirim: {data.anonymous ? 'Karyawan (Anonim)' : `${data.authorName || 'Karyawan Terdaftar'}`}</span>
            </div>
          </div>

          {/* Vertical Progress Timeline */}
          <div className="space-y-8 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 border-dashed"></div>

            {statusSteps.map((step, idx) => {
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;
              const isFuture = idx > activeIndex;

              // Find specific history logs for this step if any
              const historyLog = data.progressHistory.find(log => {
                if (step.status === 'submitted') return log.status === 'submitted';
                if (step.status === 'reviewed') return log.status === 'reviewed';
                if (step.status === 'in_progress') return log.status === 'in_progress';
                if (step.status === 'management') return log.status === 'management';
                if (step.status === 'resolved') return log.status === 'resolved';
                return false;
              });

              return (
                <div key={step.status} className={`flex gap-6 relative transition-opacity duration-200 ${isFuture ? 'opacity-40' : 'opacity-100'}`}>
                  {/* Circle Indicator */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 font-bold text-xs ${
                    isCompleted 
                      ? 'bg-natural-moss text-white' 
                      : isActive 
                        ? 'border-2 border-natural-moss bg-white text-natural-moss ring-4 ring-natural-moss/10' 
                        : 'border-2 border-gray-300 bg-white text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <h4 className={`text-sm font-bold ${isActive ? 'text-natural-deep' : 'text-gray-700'}`}>
                        {step.label}
                      </h4>
                      {historyLog && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(historyLog.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-natural-muted mt-0.5">{step.desc}</p>

                    {/* Progress Detail Log */}
                    {historyLog && (
                      <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-xs text-gray-600 italic">"{historyLog.description}"</p>
                        
                        {historyLog.feedbackPhotoUrl && (
                          <div className="mt-2.5">
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Lampiran Foto Progres:</span>
                            <a 
                              href={historyLog.feedbackPhotoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block group overflow-hidden rounded-lg border border-indigo-100 bg-white p-1 hover:border-indigo-400 transition-all max-w-xs"
                            >
                              <img 
                                src={getGoogleDriveDirectUrl(historyLog.feedbackPhotoUrl)} 
                                alt="Lampiran Progres" 
                                className="max-h-32 rounded object-contain transition-transform group-hover:scale-[1.02]"
                                referrerPolicy="no-referrer"
                              />
                            </a>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-natural-muted">
                          <span className="font-semibold text-natural-deep">Petugas:</span>
                          <span>{historyLog.updatedBy}</span>
                        </div>
                      </div>
                    )}

                    {/* If PIC is assigned to this in_progress step but hasn't finalized it */}
                    {step.status === 'in_progress' && isActive && data.picName && (
                      <div className="mt-2 p-3 bg-amber-50/70 text-amber-900 border border-amber-100 rounded-xl text-xs">
                        📍 Sedang ditangani oleh PIC: <strong>{data.picName} ({data.picDepartment || 'Umum'})</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3 text-xs text-natural-muted">
            <ShieldCheck className="w-4 h-4 text-natural-sage flex-shrink-0" />
            <span>Kerahasiaan Anda sepenuhnya dilindungi oleh enkripsi platform internal.</span>
          </div>
        </div>
      )}
    </div>
  );
}
