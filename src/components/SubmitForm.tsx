import React, { useState } from 'react';
import { User, Aspirasi } from '../types';
import { Lightbulb, MessageSquare, AlertCircle, Sparkles, Send, EyeOff, UserCheck, ShieldCheck, ArrowRight, Camera, Trash2, Paperclip } from 'lucide-react';
import Swal from 'sweetalert2';

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

interface SubmitFormProps {
  currentUser: User | null;
  onShowAuth: () => void;
  onSubmissionSuccess: (trackingCode: string, isIdea: boolean) => void;
}

export default function SubmitForm({ currentUser, onShowAuth, onSubmissionSuccess }: SubmitFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalClassification, setOriginalClassification] = useState<'ide' | 'kritik_saran'>('kritik_saran');
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState<Aspirasi | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  // File states
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // If user is logged in, default anonymous can be false or true. Let's make it easy to choose.
  const isEmployeeLoggedIn = !!currentUser;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
        setFileName(file.name);
        setFileType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
        setFileName(file.name);
        setFileType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Judul dan Deskripsi tidak boleh kosong');
      return;
    }

    setLoading(true);
    setError('');
    setSubmittedData(null);

    Swal.fire({
      title: 'Mengirim Aspirasi...',
      text: 'Sedang menganalisis klasifikasi AI dan mengunggah lampiran gambar ke Google Drive...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const body = {
      title,
      content,
      originalClassification,
      authorId: isEmployeeLoggedIn ? currentUser.id : null,
      anonymous: isEmployeeLoggedIn ? anonymous : true, // Always anonymous if not logged in
      fileBase64,
      fileName,
      fileType
    };

    try {
      const response = await fetch('/api/aspirasi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim aspirasi');
      }

      setSubmittedData(data.data);
      if (data.warning) {
        setUploadWarning(data.warning);
      } else {
        setUploadWarning(null);
      }
      
      // Clear inputs
      setTitle('');
      setContent('');
      setFileBase64('');
      setFileName('');
      setFileType('');
      
      Swal.fire({
        icon: 'success',
        title: 'Aspirasi Terkirim!',
        text: `Sukses mendaftarkan aspirasi dengan Kode Lacak: ${data.data.trackingCode}`,
        timer: 3000,
        showConfirmButton: true
      });

      // Notify parent
      const isIdea = data.data.aiClassification === 'ide';
      onSubmissionSuccess(data.data.trackingCode, isIdea);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.message || 'Terjadi kesalahan eksternal.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Submission Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-natural-beige relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-natural-moss/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>

        <h1 className="text-3xl font-serif font-medium text-natural-deep mb-2">Suarakan Aspirasimu</h1>
        <p className="text-natural-muted text-sm mb-6 leading-relaxed">
          Sampaikan kritik, saran, atau ide inovasimu untuk perusahaan. Keluhan dapat diajukan secara anonim tanpa login. AI pintar kami akan menganalisis konten untuk mempercepat disposisi.
        </p>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Classification Preference Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-muted mb-2">Estimasi Jenis Laporan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-pref-saran"
                type="button"
                onClick={() => setOriginalClassification('kritik_saran')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  originalClassification === 'kritik_saran'
                    ? 'border-natural-sage bg-natural-light/50 text-natural-deep ring-1 ring-natural-sage'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-natural-sage" />
                Kritik & Saran
              </button>
              <button
                id="btn-pref-ide"
                type="button"
                onClick={() => setOriginalClassification('ide')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  originalClassification === 'ide'
                    ? 'border-natural-sage bg-natural-light/50 text-natural-deep ring-1 ring-natural-sage'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Ide & Inovasi
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-muted mb-2">Judul Aspirasi</label>
            <input
              id="input-asp-title"
              type="text"
              required
              placeholder="Contoh: Usulan Digitalisasi Reimbursement atau Layanan AC Lantai 3"
              className="w-full px-4 py-3 rounded-xl bg-natural-light border-transparent focus:ring-2 focus:ring-natural-moss focus:bg-white transition-all text-sm text-natural-deep placeholder-gray-400 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-muted mb-2">Isi Detail Laporan / Ide</label>
            <textarea
              id="textarea-asp-content"
              required
              rows={5}
              placeholder="Jelaskan secara lengkap ide baru Anda, atau masalah beserta usulan perbaikan yang konkret agar tim PIC dapat menindaklanjutinya dengan cepat..."
              className="w-full px-4 py-3 rounded-xl bg-natural-light border-transparent focus:ring-2 focus:ring-natural-moss focus:bg-white transition-all text-sm text-natural-deep placeholder-gray-400 focus:outline-none resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Optional Photo Attachment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-muted mb-2">
              Lampiran Foto (Opsional)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                dragActive ? "border-natural-sage bg-natural-light/50" : "border-natural-border/60 bg-natural-light/20"
              }`}
            >
              {fileBase64 ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  {fileType.startsWith('image/') && (
                    <img
                      src={fileBase64}
                      alt="Preview"
                      className="max-h-40 rounded-lg object-contain shadow-sm border border-natural-border bg-white p-1"
                    />
                  )}
                  <div className="flex items-center gap-2 text-sm text-natural-deep font-medium">
                    <Paperclip className="w-4 h-4 text-natural-sage" />
                    <span className="truncate max-w-[200px]">{fileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileBase64('');
                        setFileName('');
                        setFileType('');
                      }}
                      className="p-1 rounded-full text-red-600 hover:bg-red-50 transition"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block py-4">
                  <Camera className="w-8 h-8 text-natural-muted mx-auto mb-2" />
                  <span className="text-xs text-natural-deep font-semibold block">
                    Tarik & lepas foto ke sini, atau klik untuk memilih
                  </span>
                  <span className="text-[10px] text-natural-muted block mt-1">
                    Format gambar (JPG, PNG) maksimal 5MB. Otomatis tersimpan ke folder Google Drive.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Anonymous Option if Logged In */}
          {isEmployeeLoggedIn ? (
            <div className="p-3 bg-natural-light rounded-xl flex items-center justify-between">
              <span className="text-xs text-natural-deep flex items-center gap-2 font-medium">
                {anonymous ? (
                  <>
                    <EyeOff className="w-4 h-4 text-natural-sage" />
                    Kirim sebagai Anonim (Identitas Dirahasiakan)
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Kirim atas nama: <strong className="text-emerald-700">{currentUser.name}</strong>
                  </>
                )}
              </span>
              <button
                id="btn-toggle-anon"
                type="button"
                onClick={() => setAnonymous(!anonymous)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-dotted"
              >
                Ubah ke {anonymous ? 'Nama Terbuka' : 'Anonim'}
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-900 leading-relaxed">
                ℹ️ Anda sedang tidak masuk akun. Laporan Anda akan dikirim <strong>100% secara Anonim</strong>. Anda akan mendapat kode lacak unik sesudah mengirim.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-submit-aspirasi"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-natural-moss text-white rounded-2xl font-bold hover:bg-natural-sage shadow-md shadow-natural-moss/20 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Menganalisis dengan AI...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Kirim Aspirasi Sekarang
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success Modal / Banner within workflow */}
      {submittedData && (
        <div id="submission-success-banner" className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">Aspirasi Berhasil Dikirim!</h3>
              <p className="text-emerald-800 text-xs mt-1">
                Aspirasi Anda berhasil dicatat dan dalam peninjauan tim Kepatuhan (Compliance).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-gray-500 font-medium">KODE PELACAKAN (SIMPAN INI!):</span>
              <span className="font-mono text-sm font-bold bg-gray-100 text-gray-800 px-3 py-1 rounded-lg select-all">
                {submittedData.trackingCode}
              </span>
            </div>

            {/* AI Result */}
            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Deteksi Klasifikasi AI:
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                  submittedData.aiClassification === 'ide' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {submittedData.aiClassification === 'ide' ? '💡 IDE BARU / INOVASI' : '💬 KRITIK & SARAN'}
                </span>

                {submittedData.topic && (
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${getTopicBadgeStyle(submittedData.topic)}`}>
                    Topik: {submittedData.topic}
                  </span>
                )}
              </div>
              <p className="text-gray-600 italic">"{submittedData.aiReason}"</p>
            </div>

            {uploadWarning && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-700">
                  <span>⚠</span> Lampiran Gagal Diunggah ke Google Drive
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Aspirasi Anda berhasil disimpan, tetapi lampiran gambar tidak dapat diunggah ke Google Drive.
                </p>
                <div className="p-1.5 bg-white/70 rounded border border-amber-100 text-[10px] font-mono break-all text-amber-800">
                  {uploadWarning}
                </div>
                <p className="text-gray-500 text-[10px] leading-normal pt-1">
                  <strong>Saran Penyelesaian:</strong> Hal ini biasanya terjadi karena Google Apps Script Anda memerlukan persetujuan izin (DriveApp) atau Web App belum di-deploy ulang sebagai <strong>"New Version"</strong> dengan akses <strong>"Anyone"</strong>. Silakan periksa atau update deployment Google Apps Script Anda.
                </p>
              </div>
            )}
          </div>

          {/* Crucial requirement: "jika merupakan ide maka sistem akan mempersilahkan dia untuk login (sebagai bentuk apresiasi)" */}
          {submittedData.aiClassification === 'ide' && !isEmployeeLoggedIn && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <h4 className="font-bold text-sm">Apresiasi Ide Inovatif Anda! 🌟</h4>
              </div>
              <p className="text-xs text-amber-50 leading-relaxed">
                AI kami mendeteksi kontribusi ini sebagai <strong>Ide/Inovasi bernilai tinggi</strong>! Kami sangat mengapresiasi inovasi karyawan. Daftarkan akun atau login sekarang agar ide ini dapat tercatat atas nama Anda untuk mendapatkan rewards/penghargaan prestasi karyawan.
              </p>
              <button
                id="btn-success-login-prompt"
                type="button"
                onClick={onShowAuth}
                className="w-full bg-white text-amber-950 font-bold py-2 px-4 rounded-lg text-xs hover:bg-amber-50 transition flex items-center justify-center gap-1.5"
              >
                Masuk / Daftar Akun untuk Klaim Ide
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
