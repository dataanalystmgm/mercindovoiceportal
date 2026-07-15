import React, { useState, useEffect } from 'react';
import { User, Aspirasi, ProgressStatus } from '../types';
import { Shield, Eye, EyeOff, CheckSquare, Users, Edit2, AlertCircle, FileText, CheckCircle, RefreshCw, Send, ArrowRight, Settings, Bell, Smartphone, Activity, Info, AlertTriangle, MessageSquare, Database, Copy, Check, Camera, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { getGoogleDriveDirectUrl } from '../utils';

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


interface AdminDashboardProps {
  currentUser: User;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<Aspirasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtering States for Admin
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ide' | 'kritik_saran'>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  
  // Form State for updates
  const [selectedItem, setSelectedItem] = useState<Aspirasi | null>(null);
  const [updateStatus, setUpdateStatus] = useState<ProgressStatus>('in_progress');
  const [updateDescription, setUpdateDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  
  // Feedback photo states
  const [feedbackPhotoBase64, setFeedbackPhotoBase64] = useState<string>('');
  const [feedbackPhotoName, setFeedbackPhotoName] = useState<string>('');
  const [feedbackPhotoType, setFeedbackPhotoType] = useState<string>('');
  const [feedbackPhotoPreview, setFeedbackPhotoPreview] = useState<string>('');

  const handleFeedbackPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran file terlalu besar',
        text: 'Ukuran file maksimal adalah 5MB'
      });
      return;
    }

    setFeedbackPhotoName(file.name);
    setFeedbackPhotoType(file.type);
    setFeedbackPhotoPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFeedbackPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFeedbackPhoto = () => {
    setFeedbackPhotoBase64('');
    setFeedbackPhotoName('');
    setFeedbackPhotoType('');
    setFeedbackPhotoPreview('');
    const input = document.getElementById('input-feedback-photo') as HTMLInputElement;
    if (input) input.value = '';
  };

  // PIC assignment details
  const [picName, setPicName] = useState('');
  const [picDepartment, setPicDepartment] = useState('');
  const [picSearchQuery, setPicSearchQuery] = useState('');

  const getTwoDaysFromNow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const fetchSubmissions = async (showLoadingAlert = false) => {
    setLoading(true);
    if (showLoadingAlert) {
      Swal.fire({
        title: 'Mengambil Data...',
        text: 'Sedang memuat data dari server.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }
    try {
      const response = await fetch('/api/aspirasi/all');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat data');
      setSubmissions(data);
      if (showLoadingAlert) {
        Swal.close();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
      if (showLoadingAlert) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengambil Data',
          text: err.message || 'Gagal terhubung ke server'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(true);
    fetchFirebaseStatus();
  }, []);

  const [firebaseStatus, setFirebaseStatus] = useState<any>(null);
  const [syncingFirebase, setSyncingFirebase] = useState(false);

  const fetchFirebaseStatus = async () => {
    try {
      const response = await fetch('/api/firebase-status');
      if (response.ok) {
        const data = await response.json();
        setFirebaseStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch firebase status', err);
    }
  };

  const handleForceSyncFirebase = async () => {
    setSyncingFirebase(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/sync-local-to-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Sinkronisasi ke Firebase Cloud berhasil!');
        fetchFirebaseStatus();
        fetchPicsList();
        fetchSubmissions();
      } else {
        setError(data.error || 'Gagal melakukan sinkronisasi');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setSyncingFirebase(false);
    }
  };

  // Sub-tab selection: submissions or pics
  const [activeSubTab, setActiveSubTab] = useState<'submissions' | 'pics'>('submissions');

  // Google Sheet Web App Server States
  const [googleSheetWebappUrl, setGoogleSheetWebappUrlState] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncingToSheet, setSyncingToSheet] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setGoogleSheetWebappUrlState(data.googleSheetWebappUrl || '');
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleSheetWebappUrl: googleSheetWebappUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan konfigurasi');
      setSuccess('Konfigurasi server berhasil disimpan!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSyncToSheet = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin melakukan sinkronisasi semua data lokal saat ini ke Google Sheets? Semua data users, aspirasi, dan PIC akan dikirim ke sheet masing-masing.');
    if (!confirmed) return;

    setSyncingToSheet(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/sync-to-sheet', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi data');
      setSuccess(data.message || 'Sinkronisasi ke Google Sheets berhasil!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncingToSheet(false);
    }
  };

  // PIC Database States
  const [pics, setPics] = useState<any[]>([]);
  const [picLoading, setPicLoading] = useState(false);
  const [editingPic, setEditingPic] = useState<any | null>(null);
  const [showPicModal, setShowPicModal] = useState(false);
  const [picForm, setPicForm] = useState({
    id: '',
    nik: '',
    name: '',
    section: '',
    user: '',
    domain: '',
    emailPic: '',
    emailManagerSpv: ''
  });

  const fetchPicsList = async () => {
    setPicLoading(true);
    try {
      const response = await fetch('/api/pics');
      if (response.ok) {
        const data = await response.json();
        setPics(data);
      } else {
        throw new Error('Gagal memuat database PIC dari server.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPicLoading(false);
    }
  };

  const handleSavePic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picForm.nik || !picForm.name) {
      setError('NIK dan Nama PIC wajib diisi!');
      return;
    }
    
    const action = picForm.id ? 'memperbarui' : 'menambahkan';
    const confirmed = window.confirm(`Apakah Anda yakin ingin ${action} data PIC ini?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/pics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(picForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan data PIC');
      setSuccess('Data PIC berhasil disimpan!');
      setShowPicModal(false);
      fetchPicsList();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePic = async (id: string, name: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus data PIC ${name}? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/pics/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menghapus data PIC');
      setSuccess('Data PIC berhasil dihapus!');
      fetchPicsList();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSyncPicsFromGoogleSheet = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin melakukan sinkronisasi ulang dengan Google Sheets? Data yang sudah ada mungkin akan ditimpa atau diperbarui sesuai sheet PIC.');
    if (!confirmed) return;

    setPicLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/pics/sync', {
        method: 'POST'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal sinkronisasi data');
      setSuccess(result.message || 'Sinkronisasi PIC berhasil!');
      setPics(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPicLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchPicsList();
    fetchConfig();
  }, []);

  const handleReviewPublish = async (id: string, currentPublicState: boolean) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/aspirasi/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: !currentPublicState,
          reviewerName: currentUser.name
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSuccess(`Status publikasi berhasil diperbarui menjadi: ${!currentPublicState ? 'Publik' : 'Privat'}`);
      fetchSubmissions();
      
      // Update selected item in view if opened
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setError('');
    setSuccess('');
    
    Swal.fire({
      title: 'Menyimpan Progres...',
      text: 'Sedang memproses tindak lanjut dan mengunggah lampiran...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      const response = await fetch(`/api/aspirasi/${selectedItem.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          picName: picName || selectedItem.picName,
          picDepartment: picDepartment || selectedItem.picDepartment,
          description: updateDescription,
          updatedBy: `${currentUser.name} (${currentUser.role === 'compliance' ? 'Compliance' : 'PIC/Ide Admin'})`,
          feedback,
          correctiveAction,
          targetCompletionDate,
          feedbackPhotoBase64,
          feedbackPhotoName,
          feedbackPhotoType
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: 'Progres & feedback tindak lanjut berhasil disimpan!',
        timer: 1800,
        showConfirmButton: false
      });

      setSuccess('Status & Tindak lanjut berhasil disimpan!');
      setUpdateDescription('');
      setFeedback('');
      setCorrectiveAction('');
      setTargetCompletionDate('');
      handleRemoveFeedbackPhoto();
      setSelectedItem(null);
      fetchSubmissions();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Progres',
        text: err.message || 'Gagal menyimpan progres status.'
      });
      setError(err.message);
    }
  };

  const selectItemForUpdate = (item: Aspirasi) => {
    Swal.fire({
      title: 'Memuat Tindak Lanjut...',
      text: 'Sedang menyiapkan halaman penanganan laporan.',
      timer: 500,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      setSelectedItem(item);
      setUpdateStatus(item.status);
      setPicName(item.picName || '');
      setPicDepartment(item.picDepartment || '');
      setUpdateDescription('');
      setFeedback(item.feedback || '');
      setCorrectiveAction(item.correctiveAction || '');
      setTargetCompletionDate(item.targetCompletionDate || getTwoDaysFromNow());
      handleRemoveFeedbackPhoto();
    });
  };

  // Filters depending on role, category, and topic
  const filteredSubmissions = submissions.filter(item => {
    // Role filter
    if (currentUser.role === 'pic') {
      // PIC sees reports assigned to them, or unassigned ones that need action
      const isAssignedToMe = item.picName === currentUser.name;
      const isUnassigned = !item.picName;
      if (!isAssignedToMe && !isUnassigned) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && item.aiClassification !== categoryFilter) {
      return false;
    }

    // Topic filter
    if (topicFilter !== 'all' && item.topic !== topicFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="bg-white border border-natural-beige rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            {currentUser.role.toUpperCase()} PORTAL
          </span>
          <h2 className="text-xl font-serif font-bold text-natural-deep mt-2">
            Halo, {currentUser.name}!
          </h2>
          <p className="text-xs text-natural-muted">
            Departemen: <strong className="text-natural-deep">{currentUser.department || 'Umum'}</strong> • Tanggung jawab Anda tercantum di bawah ini.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id="btn-refresh-dashboard"
            onClick={() => fetchSubmissions(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-natural-light text-natural-deep hover:bg-natural-border text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100">
          🎉 {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-natural-beige gap-2">
        <button
          id="tab-view-submissions"
          type="button"
          onClick={() => setActiveSubTab('submissions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'submissions'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-natural-muted hover:text-natural-deep font-medium'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Daftar Aspirasi ({submissions.length})
        </button>
        <button
          id="tab-view-pics"
          type="button"
          onClick={() => {
            setActiveSubTab('pics');
            fetchPicsList();
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'pics'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-natural-muted hover:text-natural-deep font-medium'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Database PIC ({pics.length})
        </button>
      </div>

      {activeSubTab === 'submissions' && (
        <div className="space-y-6">
          {selectedItem ? (
            /* DEDICATED FULL VIEW FOR ACTION/UPDATE (Halaman terpisah/sendiri) */
            <div id="admin-action-box" className="bg-white border border-natural-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
              {/* Top Navigation Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-bold rounded-lg transition"
                  >
                    ← Kembali ke Daftar Aspirasi
                  </button>
                  <span className="h-6 w-px bg-gray-200 hidden sm:block" />
                  <h3 className="text-sm font-bold text-natural-deep uppercase tracking-wider">
                    Tindak Lanjut Laporan
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs bg-natural-light px-2.5 py-1 rounded font-bold text-gray-600">
                    {selectedItem.trackingCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                    selectedItem.aiClassification === 'ide'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedItem.aiClassification === 'ide' ? '💡 IDE' : '💬 SARAN'}
                  </span>
                  {selectedItem.topic && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getTopicBadgeStyle(selectedItem.topic)}`}>
                      {selectedItem.topic}
                    </span>
                  )}
                </div>
              </div>

              {/* Two Column Layout for Dedicated Page: Left = Original Info & History, Right = Edit Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Original Info & History (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Detail Content and Photos of original submission */}
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
                    <div className="font-bold text-natural-deep text-[11px] uppercase tracking-wide">
                      Detail Aspirasi Pengirim:
                    </div>
                    <h4 className="font-bold text-natural-deep text-sm">{selectedItem.title}</h4>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed text-xs">{selectedItem.content}</p>
                    
                    {selectedItem.photoUrl && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1">Lampiran Foto Pengirim:</span>
                        <a 
                          href={selectedItem.photoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-block group overflow-hidden rounded-lg border border-natural-border bg-white p-1 hover:border-natural-sage transition-all max-w-full"
                        >
                          <img 
                            src={getGoogleDriveDirectUrl(selectedItem.photoUrl)} 
                            alt="Lampiran Aspirasi" 
                            className="max-h-48 rounded object-contain transition-transform group-hover:scale-[1.01]"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      </div>
                    )}
                    {selectedItem.feedbackPhotoUrl && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Foto Hasil Tindak Lanjut Saat Ini:</span>
                        <a 
                          href={selectedItem.feedbackPhotoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-block group overflow-hidden rounded-lg border border-indigo-200 bg-white p-1 hover:border-indigo-400 transition-all max-w-full"
                        >
                          <img 
                            src={getGoogleDriveDirectUrl(selectedItem.feedbackPhotoUrl)} 
                            alt="Foto Tindak Lanjut" 
                            className="max-h-48 rounded object-contain transition-transform group-hover:scale-[1.01]"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Display Current Feedback, Corrective Action & Target Completion if they exist */}
                  {(selectedItem.feedback || selectedItem.correctiveAction || selectedItem.targetCompletionDate) && (
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3 text-xs animate-fade-in">
                      <div className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide">
                        Status & Tindak Lanjut Saat Ini:
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedItem.targetCompletionDate && (
                          <div>
                            <span className="text-[10px] font-bold text-natural-muted block">Target Penyelesaian:</span>
                            <span className="font-semibold text-indigo-950">
                              {new Date(selectedItem.targetCompletionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold text-natural-muted block">PIC Ditugaskan:</span>
                          <span className="font-semibold text-indigo-950">
                            {selectedItem.picName || 'Belum ada'} {selectedItem.picDepartment ? `(${selectedItem.picDepartment})` : ''}
                          </span>
                        </div>
                      </div>
                      
                      {selectedItem.feedback && (
                        <div>
                          <span className="text-[10px] font-bold text-natural-muted block">Feedback Penanganan (Wadah Feedback):</span>
                          <p className="text-indigo-950 whitespace-pre-line bg-white/60 p-2.5 rounded border border-indigo-100/40 mt-0.5 font-medium">"{selectedItem.feedback}"</p>
                        </div>
                      )}
                      
                      {selectedItem.correctiveAction && (
                        <div>
                          <span className="text-[10px] font-bold text-natural-muted block">Corrective Action (Tindakan Korektif):</span>
                          <p className="text-indigo-950 whitespace-pre-line bg-white/60 p-2.5 rounded border border-indigo-100/40 mt-0.5 font-medium">"{selectedItem.correctiveAction}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compliance: Approve Publication */}
                  {currentUser.role === 'compliance' && (
                    <div className="bg-natural-light rounded-2xl border border-natural-border p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-natural-deep block uppercase tracking-wide">
                          🛡️ Otorisasi Publikasi
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedItem.isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedItem.isPublic ? 'Publik' : 'Privat'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Tentukan apakah aspirasi ini layak dipublikasikan ke papan publik perusahaan atau harus tetap tertutup (privat). Pengirim anonim tetap anonim. Tindak lanjut, feedback, dan foto hasil perbaikan akan disajikan secara transparan di Board Publik.
                      </p>
                      
                      <button
                        id="btn-toggle-publication"
                        type="button"
                        onClick={() => handleReviewPublish(selectedItem.id, selectedItem.isPublic)}
                        className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                          selectedItem.isPublic
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {selectedItem.isPublic ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Batalkan Publikasi (Jadikan Privat)
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Setujui Publikasikan ke Semua Orang
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Side: Form and Update Fields (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                      Form Input Update Progres & Tindak Lanjut
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Gunakan formulir ini untuk mengisi penugasan PIC, mengubah status penanganan, melampirkan foto progres terbaru, dan mengisi tindakan korektif.
                    </p>
                  </div>

                  <form onSubmit={handleUpdateStatus} className="space-y-5">
                    {/* PIC assignment - only editable by compliance, or auto assigned if PIC updates */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Tunjuk PIC Penanggung Jawab
                      </label>
                      {currentUser.role === 'compliance' ? (
                        <div className="space-y-2.5">
                          {/* Search box for PIC */}
                          <div className="relative">
                            <input
                              id="search-pic-database"
                              type="text"
                              placeholder="Cari PIC dari Database (NIK, Nama, Bagian)..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-natural-deep focus:outline-none focus:ring-1 focus:ring-indigo-600 pl-8"
                              value={picSearchQuery}
                              onChange={(e) => setPicSearchQuery(e.target.value)}
                            />
                            <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
                          </div>

                          {/* Scrollable Matching List */}
                          <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white shadow-xs">
                            {pics.length === 0 ? (
                              <div className="p-3 text-center text-gray-400 text-[10px]">
                                Database PIC kosong. Silakan tambahkan PIC di tab Database PIC.
                              </div>
                            ) : (() => {
                              const query = picSearchQuery.toLowerCase();
                              const filtered = pics.filter(p => 
                                p.nik?.toLowerCase().includes(query) ||
                                p.name?.toLowerCase().includes(query) ||
                                p.section?.toLowerCase().includes(query)
                              );

                              if (filtered.length === 0) {
                                return (
                                  <div className="p-3 text-center text-gray-400 text-[10px]">
                                    Tidak ada PIC yang cocok dengan pencarian "{picSearchQuery}".
                                  </div>
                                );
                              }

                              return filtered.map(p => {
                                const isSelected = picName === p.name && picDepartment === p.section;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setPicName(p.name);
                                      setPicDepartment(p.section);
                                    }}
                                    className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                                      isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-gray-50 text-natural-deep'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                          ID: {p.nik}
                                        </span>
                                        <span className="font-bold text-xs">{p.name}</span>
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        Bagian: <span className="font-medium text-gray-700">{p.section}</span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <span className="text-indigo-600 font-bold text-xs">✓ Terpilih</span>
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          {/* Manual Override view/edit */}
                          <div className="bg-indigo-50/30 p-2.5 border border-indigo-100/50 rounded-lg">
                            <div className="text-[10px] text-indigo-800 font-bold mb-1.5 flex items-center justify-between">
                              <span>PIC Terpilih:</span>
                              {picName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPicName('');
                                    setPicDepartment('');
                                  }}
                                  className="text-red-500 hover:text-red-700 font-normal text-[9px]"
                                >
                                  Hapus Pilihan
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-gray-400 block mb-0.5">Nama PIC</span>
                                <input
                                  id="input-manual-pic-name"
                                  type="text"
                                  required
                                  placeholder="Belum ada PIC terpilih"
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white text-natural-deep font-bold"
                                  value={picName}
                                  onChange={(e) => setPicName(e.target.value)}
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-400 block mb-0.5">Bagian / Departemen</span>
                                <input
                                  id="input-manual-pic-dept"
                                  type="text"
                                  required
                                  placeholder="Departemen PIC"
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white text-natural-deep"
                                  value={picDepartment}
                                  onChange={(e) => setPicDepartment(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-xs">
                          <strong>{picName || 'Belum ditugaskan'}</strong> {picDepartment && `(${picDepartment})`}
                        </div>
                      )}
                    </div>

                    {/* Progress Status dropdown */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Tingkat Progres Laporan
                      </label>
                      <select
                        id="select-progress-status"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs bg-white text-natural-deep focus:outline-none focus:ring-1 focus:ring-natural-sage font-semibold"
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value as ProgressStatus)}
                      >
                        <option value="reviewed">Reviewed (Compliance)</option>
                        <option value="in_progress">In Progress (Ditindaklanjuti PIC)</option>
                        <option value="management">Top Management (Ditinjau Direksi)</option>
                        <option value="resolved">Resolved (Selesai)</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Sesuai instruksi, Anda dapat meneruskan progress dari PIC hingga ke level top management untuk transparansi user.
                      </p>
                    </div>

                    {/* Status Update Description */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Catatan Progres (Dilihat Karyawan)
                      </label>
                      <textarea
                        id="textarea-status-desc"
                        required
                        rows={3}
                        placeholder="Contoh: Kami sedang menjadwalkan perbaikan AC dengan teknisi eksternal pada hari Sabtu ini..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-natural-sage resize-none text-natural-deep placeholder-gray-400"
                        value={updateDescription}
                        onChange={(e) => setUpdateDescription(e.target.value)}
                      />
                    </div>

                    {/* Feedback Wadah */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Feedback Tindak Lanjut (Wadah Feedback)
                      </label>
                      <textarea
                        id="input-status-feedback"
                        rows={2}
                        placeholder="Masukkan feedback penyelesaian/penanganan untuk pelapor..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-natural-sage resize-none text-natural-deep placeholder-gray-400"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      
                      {/* Optional Photo Attachment for Feedback */}
                      <div className="mt-3 bg-white p-3 border border-gray-200 rounded-lg shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-natural-muted block mb-1">
                          Lampiran Foto Feedback / Hasil (Opsional)
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            id="input-feedback-photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFeedbackPhotoChange}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('input-feedback-photo')?.click()}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-natural-deep text-[11px] font-bold rounded border border-gray-300 shadow-xs flex items-center gap-1 transition"
                          >
                            <Camera className="w-3.5 h-3.5 text-natural-sage" />
                            {feedbackPhotoName ? 'Ubah Foto' : 'Pilih Foto'}
                          </button>
                          {feedbackPhotoName && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              <span className="truncate max-w-[150px]">{feedbackPhotoName}</span>
                              <button
                                type="button"
                                onClick={handleRemoveFeedbackPhoto}
                                className="text-red-500 font-bold hover:text-red-700 ml-1 text-xs"
                                title="Hapus foto"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                        {feedbackPhotoPreview && (
                          <div className="mt-2.5 relative inline-block">
                            <img
                              src={feedbackPhotoPreview}
                              alt="Pratinjau Foto Feedback"
                              className="max-h-32 rounded border border-gray-200 object-contain bg-white p-0.5"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Corrective Action */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Corrective Action (Tindakan Perbaikan)
                      </label>
                      <textarea
                        id="input-status-corrective"
                        rows={2}
                        placeholder="Tuliskan tindakan korektif / perbaikan konkret yang diambil..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-natural-sage resize-none text-natural-deep placeholder-gray-400"
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                      />
                    </div>

                    {/* Target Completion Date */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-natural-muted mb-1.5">
                        Target Penyelesaian Laporan (Batas 2 Hari)
                      </label>
                      <input
                        id="input-status-target-date"
                        type="date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-natural-deep focus:outline-none focus:ring-1 focus:ring-natural-sage"
                        value={targetCompletionDate}
                        onChange={(e) => setTargetCompletionDate(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Default target otomatis diset 2 hari dari sekarang sesuai kebijakan waktu tanggap.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        id="btn-cancel-action"
                        type="button"
                        onClick={() => setSelectedItem(null)}
                        className="flex-1 py-2.5 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-bold rounded-lg text-xs text-center transition"
                      >
                        Batal & Kembali
                      </button>
                      <button
                        id="btn-submit-action"
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Simpan Progres & Tindak Lanjut
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* REGULAR SPLIT LIST */
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-natural-deep uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-natural-sage animate-pulse" />
                    Daftar Aspirasi Karyawan ({filteredSubmissions.length})
                  </h3>
                  <p className="text-[11px] text-natural-muted">
                    Klik tombol "Tindak Lanjut" pada salah satu laporan di bawah untuk meninjau secara penuh.
                  </p>
                </div>

                {/* Category and Topic filters dropdowns */}
                <div className="flex items-center gap-2">
                  <select
                    id="admin-filter-category"
                    className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-natural-deep focus:outline-none"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value as any);
                      setTopicFilter('all'); // Reset topic filter when changing category
                    }}
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="ide">💡 Ide & Inovasi</option>
                    <option value="kritik_saran">💬 Kritik & Saran</option>
                  </select>

                  <select
                    id="admin-filter-topic"
                    className="px-2.5 py-1.5 border border-gray-200 rounded text-xs bg-white text-natural-deep focus:outline-none"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                  >
                    <option value="all">Semua Topik</option>
                    {categoryFilter !== 'kritik_saran' && (
                      <optgroup label="Topik Ide">
                        <option value="Produktivitas">Produktivitas</option>
                        <option value="Quality">Quality</option>
                        <option value="Management System">Management System</option>
                        <option value="5S">5S</option>
                        <option value="Human">Human</option>
                        <option value="Environment">Environment</option>
                      </optgroup>
                    )}
                    {categoryFilter !== 'ide' && (
                      <optgroup label="Topik Kritik/Saran">
                        <option value="Fasilitas">Fasilitas</option>
                        <option value="Hubungan Kerja">Hubungan Kerja</option>
                        <option value="Lingkungan Kerja">Lingkungan Kerja</option>
                        <option value="Human Happiness">Human Happiness</option>
                        <option value="Peraturan & Kebijakan">Peraturan & Kebijakan</option>
                        <option value="Sexual Harrasment">Sexual Harrasment</option>
                        <option value="Standar Kerja">Standar Kerja</option>
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-natural-border p-12 text-center text-gray-400 text-xs">
                  Tidak ada data laporan atau ide yang perlu ditindaklanjuti saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSubmissions.map((item) => (
                    <div
                      id={`aspirasi-card-${item.id}`}
                      key={item.id}
                      onClick={() => selectItemForUpdate(item)}
                      className="bg-white rounded-2xl p-5 border border-natural-border transition-all cursor-pointer hover:shadow-md hover:border-indigo-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2.5">
                          <span className="font-mono text-[10px] font-bold text-natural-deep bg-natural-light px-2 py-0.5 rounded-md">
                            {item.trackingCode}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                              item.aiClassification === 'ide'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              AI: {item.aiClassification === 'ide' ? '💡 IDE' : '💬 SARAN'}
                            </span>
                            
                            {item.topic && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${getTopicBadgeStyle(item.topic)}`}>
                                {item.topic}
                              </span>
                            )}
                            
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold text-white ${
                              item.status === 'submitted' ? 'bg-gray-400' :
                              item.status === 'reviewed' ? 'bg-indigo-600' :
                              item.status === 'in_progress' ? 'bg-amber-600' :
                              item.status === 'management' ? 'bg-pink-600' : 'bg-emerald-600'
                            }`}>
                              {item.status === 'submitted' ? 'Baru' :
                               item.status === 'reviewed' ? 'Reviewed' :
                               item.status === 'in_progress' ? 'Tindak Lanjut' :
                               item.status === 'management' ? 'Manajemen Puncak' : 'Selesai'}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-sm text-natural-deep mb-1.5 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                          {item.content}
                        </p>
                      </div>

                      <div className="border-t border-gray-50 pt-3 mt-auto space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] text-natural-muted">
                          <span>Oleh: {item.anonymous ? 'Anonim' : (item.authorName || 'Karyawan')}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              {item.isPublic ? (
                                <span className="text-emerald-700 flex items-center gap-0.5 font-semibold"><Eye className="w-3 h-3" /> Publik</span>
                              ) : (
                                <span className="text-gray-400 flex items-center gap-0.5"><EyeOff className="w-3 h-3" /> Privat</span>
                              )}
                            </span>
                            {item.picName && (
                              <span className="bg-natural-light px-2 py-0.5 rounded text-natural-deep font-medium">
                                PIC: {item.picName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectItemForUpdate(item);
                            }}
                            className="text-[11px] text-indigo-600 font-bold group-hover:underline flex items-center gap-1 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition"
                          >
                            Tindak Lanjut & Detail Laporan →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'pics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Google Sheets Cloud Status Banner */}
          {firebaseStatus && (
            <div className={`p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              firebaseStatus.diagnostics?.canWrite && firebaseStatus.diagnostics?.canRead
                ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200/60 text-amber-900'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    firebaseStatus.diagnostics?.canWrite && firebaseStatus.diagnostics?.canRead ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                  }`} />
                  {firebaseStatus.diagnostics?.canWrite && firebaseStatus.diagnostics?.canRead
                    ? 'Google Sheets Cloud Terkoneksi & Aktif'
                    : 'Data Berjalan Lokal (Belum Terkoneksi ke Google Sheets Cloud)'}
                </div>
                <p className="text-[11px] text-opacity-80">
                  {firebaseStatus.diagnostics?.canWrite && firebaseStatus.diagnostics?.canRead
                    ? `Sistem terhubung murni ke Google Sheets Cloud sebagai database utama Anda.`
                    : `Sistem saat ini menggunakan database lokal offline (db.json). Harap periksa hardcodedUrl di server.ts untuk menghubungkan Google Sheets.`}
                </p>
                {firebaseStatus.diagnostics?.readError && (
                  <p className="font-mono text-[10px] text-red-600 mt-1">
                    Keterangan: {firebaseStatus.diagnostics.readError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchFirebaseStatus}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 transition"
                >
                  Cek Status
                </button>
                <button
                  type="button"
                  disabled={syncingFirebase}
                  onClick={handleForceSyncFirebase}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingFirebase ? 'animate-spin' : ''}`} />
                  {syncingFirebase ? 'Sinkronisasi...' : 'Sinkronkan Data ke Google Sheets'}
                </button>
              </div>
            </div>
          )}

          {/* Header Action Section */}
          <div className="bg-white border border-natural-beige rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-natural-deep flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Database PIC Terdaftar
              </h3>
              <p className="text-xs text-natural-muted mt-1">
                Kelola data NIK, Nama, Bagian (Section), dan email PIC / Manager untuk alur disposisi.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPic(null);
                  setPicForm({
                    id: '',
                    nik: '',
                    name: '',
                    section: '',
                    user: '',
                    domain: '',
                    emailPic: '',
                    emailManagerSpv: ''
                  });
                  setShowPicModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                + Tambah PIC Baru
              </button>
            </div>
          </div>

          {/* PIC Data Table / Grid */}
          {picLoading && pics.length === 0 ? (
            <div className="bg-white border border-natural-beige rounded-2xl p-12 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-natural-muted mt-3">Mengunduh data PIC...</p>
            </div>
          ) : pics.length === 0 ? (
            <div className="bg-white border border-natural-beige rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-natural-muted/50 mx-auto" />
              <h4 className="font-serif font-bold text-natural-deep mt-4">Belum Ada Data PIC</h4>
              <p className="text-xs text-natural-muted mt-1 max-w-sm mx-auto">
                Database PIC masih kosong. Silakan gunakan tombol "+ Tambah PIC Baru" di atas untuk menambahkan data pertama Anda.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-natural-beige rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-natural-light/60 border-b border-natural-beige text-natural-deep font-bold">
                      <th className="p-4 font-bold">NIK</th>
                      <th className="p-4 font-bold">Nama Lengkap</th>
                      <th className="p-4 font-bold">Section</th>
                      <th className="p-4 font-bold">User / Domain</th>
                      <th className="p-4 font-bold">Email PIC</th>
                      <th className="p-4 font-bold">Email Mgr / SPV</th>
                      <th className="p-4 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-beige">
                    {pics.map((p) => (
                      <tr key={p.id} className="hover:bg-natural-light/30 transition text-natural-deep">
                        <td className="p-4 font-mono font-medium">{p.nik}</td>
                        <td className="p-4 font-bold">{p.name}</td>
                        <td className="p-4">{p.section}</td>
                        <td className="p-4">
                          {p.user ? (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700">
                              {p.user}{p.domain}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[11px]">{p.emailPic || <span className="text-gray-400 italic">-</span>}</td>
                        <td className="p-4 font-mono text-[11px]">{p.emailManagerSpv || <span className="text-gray-400 italic">-</span>}</td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPic(p);
                                setPicForm({ ...p });
                                setShowPicModal(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Edit PIC"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePic(p.id, p.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Hapus PIC"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal / Pop-up Dialog untuk Add & Edit PIC */}
          {showPicModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white border border-natural-beige rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in relative my-8 text-left">
                <button
                  type="button"
                  onClick={() => setShowPicModal(false)}
                  className="absolute top-4 right-4 text-natural-muted hover:text-natural-deep text-lg font-bold"
                >
                  ✕
                </button>
                
                <h3 className="font-serif font-bold text-base text-natural-deep border-b border-natural-beige pb-3">
                  {editingPic ? 'Edit Data Anggota PIC' : 'Tambah Anggota PIC Baru'}
                </h3>
                
                <form onSubmit={handleSavePic} className="space-y-4 mt-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">NIK (Nomor Induk Karyawan) *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="Contoh: MGM 002"
                        value={picForm.nik}
                        onChange={(e) => setPicForm({ ...picForm, nik: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="Contoh: Yessy Murrina"
                        value={picForm.name}
                        onChange={(e) => setPicForm({ ...picForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">Section (Bagian)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="Contoh: HRD"
                        value={picForm.section}
                        onChange={(e) => setPicForm({ ...picForm, section: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">User</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="Contoh: yessy"
                        value={picForm.user}
                        onChange={(e) => setPicForm({ ...picForm, user: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">Domain</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="Contoh: @mgmglove.com"
                        value={picForm.domain}
                        onChange={(e) => setPicForm({ ...picForm, domain: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">Email PIC</label>
                    <input
                      type="email"
                      className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="Contoh: yessy@mgmglove.com"
                      value={picForm.emailPic}
                      onChange={(e) => setPicForm({ ...picForm, emailPic: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-natural-deep uppercase tracking-wider block">Email Manager/SPV</label>
                    <input
                      type="email"
                      className="w-full px-3 py-1.5 border border-natural-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="Contoh: yessy@mgmglove.com"
                      value={picForm.emailManagerSpv}
                      onChange={(e) => setPicForm({ ...picForm, emailManagerSpv: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-natural-beige">
                    <button
                      type="button"
                      onClick={() => setShowPicModal(false)}
                      className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold rounded-lg text-xs text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs text-center transition"
                    >
                      {editingPic ? 'Perbarui PIC' : 'Simpan PIC Baru'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
