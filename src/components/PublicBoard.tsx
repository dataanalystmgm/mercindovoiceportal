import React, { useState, useEffect } from 'react';
import { Aspirasi } from '../types';
import { Eye, MessageSquare, Lightbulb, Search, Calendar, ChevronRight, CheckCircle2, ShieldAlert, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import { getGoogleDriveDirectUrl } from '../utils';

interface PublicBoardProps {
  onSelectTrack: (code: string) => void;
}

export default function PublicBoard({ onSelectTrack }: PublicBoardProps) {
  const [publicList, setPublicList] = useState<Aspirasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'ide' | 'kritik_saran'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchPublicData = async (showLoadingAlert = false) => {
    setLoading(true);
    if (showLoadingAlert) {
      Swal.fire({
        title: 'Mengambil Data...',
        text: 'Sedang memuat data papan aspirasi publik.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }
    try {
      const response = await fetch('/api/aspirasi/public');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat data');
      setPublicList(data);
      if (showLoadingAlert) {
        Swal.close();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
      if (showLoadingAlert) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memuat',
          text: err.message || 'Gagal terhubung ke server'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData(true);
  }, []);

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

  // Lists of topics
  const kritikSaranTopics = [
    'Fasilitas', 'Hubungan Kerja', 'Lingkungan Kerja', 'Human Happiness', 
    'Peraturan & Kebijakan', 'Sexual Harrasment', 'Standar Kerja'
  ];

  const ideTopics = [
    'Produktivitas', 'Quality', 'Management System', '5S', 'Human', 'Environment'
  ];

  // Reset selected topic filter when changing main category filter
  const handleFilterChange = (newFilter: 'all' | 'ide' | 'kritik_saran') => {
    setFilter(newFilter);
    setSelectedTopic('all');
  };

  const filteredItems = publicList.filter(item => {
    // Category filter
    if (filter !== 'all' && item.aiClassification !== filter) {
      return false;
    }
    // Topic filter
    if (selectedTopic !== 'all' && item.topic !== selectedTopic) {
      return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.trackingCode.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-natural-sage to-natural-deep text-white rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="max-w-xl">
          <span className="px-2.5 py-1 bg-white/10 rounded text-[10px] uppercase tracking-wider font-mono">
            Transparansi Perusahaan
          </span>
          <h2 className="text-2xl font-serif font-medium mt-3 mb-2 text-[#F9F7F2]">
            Papan Aspirasi Terbuka (Public Board)
          </h2>
          <p className="text-xs text-natural-muted leading-relaxed">
            Hanya aspirasi yang telah disetujui untuk publikasi oleh tim Kepatuhan (Compliance) yang ditampilkan di sini demi kenyamanan bersama. Klik laporan untuk melihat kronologi penanganan secara rinci.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-natural-beige flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Buttons */}
          <div className="flex gap-2">
            <button
              id="btn-filter-all"
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-natural-deep text-white'
                  : 'bg-natural-light text-natural-deep hover:bg-natural-border'
              }`}
            >
              Semua Aspirasi ({publicList.length})
            </button>
            <button
              id="btn-filter-ide"
              type="button"
              onClick={() => handleFilterChange('ide')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                filter === 'ide'
                  ? 'bg-amber-600 text-white'
                  : 'bg-natural-light text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Ide & Inovasi ({publicList.filter(i => i.aiClassification === 'ide').length})
            </button>
            <button
              id="btn-filter-saran"
              type="button"
              onClick={() => handleFilterChange('kritik_saran')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                filter === 'kritik_saran'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-natural-light text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Kritik & Saran ({publicList.filter(i => i.aiClassification === 'kritik_saran').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              id="input-board-search"
              type="text"
              placeholder="Cari kata kunci / kode / topik..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-natural-light text-xs text-natural-deep border-transparent focus:ring-1 focus:ring-natural-sage focus:outline-none placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Sub-topic Filter pills (Shown when filtering by a specific category) */}
        {filter !== 'all' && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-natural-muted uppercase mb-2">Saring berdasarkan topik AI:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTopic('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedTopic === 'all'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua Topik
              </button>
              {(filter === 'ide' ? ideTopics : kritikSaranTopics).map((t) => {
                const count = publicList.filter(i => i.aiClassification === filter && i.topic === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTopic(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      selectedTopic === t
                        ? 'bg-natural-sage text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
                    }`}
                  >
                    {t}
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Public items */}
      {loading ? (
        <div className="text-center py-12 text-natural-muted text-xs">
          Memuat data papan aspirasi publik...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-natural-beige p-12 text-center text-gray-400 text-xs">
          Belum ada aspirasi publik yang sesuai dengan pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <div
              id={`public-card-${item.id}`}
              key={item.id}
              onClick={() => onSelectTrack(item.trackingCode)}
              className="bg-white rounded-2xl p-6 border border-natural-beige hover:border-natural-sage hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="font-mono text-[10px] font-bold text-natural-muted bg-natural-light px-2 py-0.5 rounded">
                    {item.trackingCode}
                  </span>
                  
                  <div className="flex gap-1.5 items-center">
                    {item.topic && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold tracking-wide ${getTopicBadgeStyle(item.topic)}`}>
                        {item.topic}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                      item.aiClassification === 'ide'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {item.aiClassification === 'ide' ? '💡 Ide' : '💬 Saran'}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-natural-deep group-hover:text-natural-sage transition mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                  {item.content}
                </p>

                {item.photoUrl && (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1">Lampiran Foto Pengirim:</span>
                    <a 
                      href={item.photoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-block group overflow-hidden rounded-lg border border-natural-border bg-white p-1 hover:border-natural-sage transition-all"
                    >
                      <img 
                        src={getGoogleDriveDirectUrl(item.photoUrl)} 
                        alt="Lampiran" 
                        className="max-h-24 rounded object-contain transition-transform group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                )}

                {item.feedbackPhotoUrl && (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Foto Bukti Selesai / Tindak Lanjut:</span>
                    <a 
                      href={item.feedbackPhotoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-block group overflow-hidden rounded-lg border border-indigo-100 bg-white p-1 hover:border-indigo-400 transition-all"
                    >
                      <img 
                        src={getGoogleDriveDirectUrl(item.feedbackPhotoUrl)} 
                        alt="Foto Tindak Lanjut" 
                        className="max-h-24 rounded object-contain transition-transform group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                )}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'resolved' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                  }`}></span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">
                    Status: {
                      item.status === 'submitted' ? 'Diajukan' :
                      item.status === 'reviewed' ? 'Reviewed' :
                      item.status === 'in_progress' ? 'Tindak Lanjut PIC' :
                      item.status === 'management' ? 'Manajemen Puncak' : 'Selesai'
                    }
                  </span>
                </div>

                <div className="flex items-center text-[10px] text-indigo-600 font-semibold hover:underline">
                  Lacak Progres
                  <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
