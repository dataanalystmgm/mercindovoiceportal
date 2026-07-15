import express from 'express';
import path from 'path';
import fs from 'fs';

import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure db.json file exists and seed it if needed
const DB_PATH = path.join(process.cwd(), 'db.json');

const defaultUsers = [
  {
    id: 'user-compliance',
    email: 'compliance@perusahaan.com',
    password: 'compliance123',
    name: 'Sarah Amalia',
    role: 'compliance',
    department: 'Legal & Compliance',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-pic',
    email: 'pic@perusahaan.com',
    password: 'pic123',
    name: 'Budi Santoso',
    role: 'pic',
    department: 'IT Operations',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-pic2',
    email: 'hrd@perusahaan.com',
    password: 'hrd123',
    name: 'Dewi Lestari',
    role: 'pic',
    department: 'Human Resources',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-employee',
    email: 'karyawan@perusahaan.com',
    password: 'karyawan123',
    name: 'Rian Hidayat',
    role: 'employee',
    department: 'Sales & Marketing',
    createdAt: new Date().toISOString()
  }
];

const defaultAspirasi = [
  {
    id: 'asp-1',
    trackingCode: 'ASP-9281-XYZ',
    title: 'Saran AC Ruangan Rapat Lantai 3',
    content: 'AC di ruang rapat utama lantai 3 sering sekali mati atau bocor air di siang hari, mengganggu kenyamanan saat bertemu klien penting. Mohon segera dilakukan service rutin.',
    originalClassification: 'kritik_saran',
    aiClassification: 'kritik_saran',
    aiReason: 'AI mendeteksi ini sebagai Kritik/Saran karena membahas kerusakan fasilitas kantor (AC bocor) dan memohon perbaikan operasional.',
    topic: 'Fasilitas',
    isPublic: true,
    isReviewed: true,
    status: 'in_progress',
    picName: 'Budi Santoso',
    picDepartment: 'IT Operations',
    authorId: null,
    anonymous: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    progressHistory: [
      {
        id: 'log-1a',
        status: 'submitted',
        description: 'Aspirasi diajukan oleh karyawan (Anonim).',
        updatedBy: 'Sistem',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-1b',
        status: 'reviewed',
        description: 'Ditinjau oleh tim Compliance. Laporan valid dan diputuskan dipublikasikan untuk transparansi.',
        updatedBy: 'Sarah Amalia (Compliance)',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-1c',
        status: 'in_progress',
        description: 'Ditugaskan ke Budi Santoso (IT Operations) untuk penjadwalan teknisi AC eksternal.',
        updatedBy: 'Sarah Amalia (Compliance)',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'asp-2',
    trackingCode: 'ASP-7721-IDE',
    title: 'Inovasi Sistem Paperless untuk Klaim Reimbursement',
    content: 'Bagaimana jika kita membuat portal digital sederhana untuk reimbursement biaya transport & medis? Saat ini kita masih pakai kertas fisik & tanda tangan basah, yang memakan waktu lama dan boros kertas. Dengan portal, karyawan tinggal upload foto struk belanja saja.',
    originalClassification: 'ide',
    aiClassification: 'ide',
    aiReason: 'AI mendeteksi ini sebagai Ide karena menawarkan inovasi/solusi baru berupa pembuatan portal reimbursement digital untuk menghemat kertas dan meningkatkan efisiensi proses.',
    topic: 'Produktivitas',
    isPublic: true,
    isReviewed: true,
    status: 'management',
    picName: 'Sarah Amalia',
    picDepartment: 'Legal & Compliance',
    authorId: 'user-employee',
    authorName: 'Rian Hidayat',
    anonymous: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    progressHistory: [
      {
        id: 'log-2a',
        status: 'submitted',
        description: 'Ide diajukan oleh Rian Hidayat.',
        updatedBy: 'Sistem',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-2b',
        status: 'reviewed',
        description: 'Ditinjau oleh compliance. Ide sangat konstruktif dan disetujui untuk dipublikasikan sebagai apresiasi.',
        updatedBy: 'Sarah Amalia (Compliance)',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-2c',
        status: 'in_progress',
        description: 'Dianalisis kelayakannya oleh Tim IT & Admin. Sedang dihitung anggaran penghematannya.',
        updatedBy: 'Sarah Amalia (Compliance)',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'log-2d',
        status: 'management',
        description: 'Diajukan ke jajaran Direksi / Top Management untuk persetujuan anggaran pembuatan modul paperless di kuartal berikutnya.',
        updatedBy: 'Sarah Amalia (Compliance)',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

function parseCSV(csvText: string): any[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];
  
  const parseRow = (rowText: string): string[] => {
    const cols: string[] = [];
    let val = '';
    let inQ = false;
    for (let i = 0; i < rowText.length; i++) {
      const c = rowText[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cols.push(val.trim());
        val = '';
      } else {
        val += c;
      }
    }
    cols.push(val.trim());
    return cols.map(c => {
      if (c.startsWith('"') && c.endsWith('"')) {
        return c.slice(1, -1).trim();
      }
      return c;
    });
  };

  const headers = parseRow(lines[0]);
  const results: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseRow(line);
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = cols[index] || '';
    });
    results.push(obj);
  }
  return results;
}

async function fetchPicsFromGoogleSheet(): Promise<any[]> {
  try {
    const url = 'https://docs.google.com/spreadsheets/d/1O67xJivO0lZykk_JahSbEYH-r4-aLyQYI9kA1FCXtcI/export?format=csv&gid=1557931774';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    return rows.map((row, idx) => ({
      id: row['NIK'] ? `pic-${row['NIK'].replace(/\s+/g, '-').toLowerCase()}` : `pic-gen-${idx}-${Date.now()}`,
      nik: row['NIK'] || '',
      name: row['Name'] || '',
      section: row['Section'] || '',
      user: row['User'] || '',
      domain: row['Domain'] || '',
      emailPic: row['Email PIC'] || '',
      emailManagerSpv: row['Email Manager/SPV'] || '',
      emailDirektur: row['Email Direktur'] || '',
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch PIC data from Google Sheet:', error);
    return [];
  }
}

function getGoogleSheetWebappUrl(): string {
  // SILAKAN HARDCODE DI SINI JIKA INGIN LANGSUNG DI DALAM KODE:
  // Contoh: const hardcodedUrl = "https://script.google.com/macros/s/AKfycbw21.../exec";
  const hardcodedUrl: string = "https://script.google.com/macros/s/AKfycbyRVi_1xEIgX1aNMz9R8vNByk-BmRy1J2MTsKmLZwRQue_cqHBBZLZVZ6nfTdsu2oK7/exec"; 
  if (hardcodedUrl) {
    return hardcodedUrl;
  }

  let envUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || '';
  if (envUrl) {
    // Bersihkan spasi dan tanda kutip ganda/tunggal jika ada dari file .env
    envUrl = envUrl.trim().replace(/^["']|["']$/g, '');
    return envUrl;
  }
  try {
    const local = readLocalDatabase();
    if (local.config && local.config.googleSheetWebappUrl) {
      return local.config.googleSheetWebappUrl.trim();
    }
  } catch (err) {}
  return '';
}

async function fetchFromGoogleSheet(table: string): Promise<any[]> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (!webappUrl) return [];
  try {
    const res = await fetch(`${webappUrl}?action=read&table=${table}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`Gagal membaca JSON dari Google Sheets untuk tabel ${table}. Respons yang diterima:`, text);
      throw new Error(`Google Sheets Web App mengembalikan respons tidak valid (halaman HTML bukan JSON). Harap pastikan Web App URL sudah benar, dideploy dengan akses "Anyone" (Siapa saja, bukan "Anyone with Google Account"), dan pastikan Anda sudah melakukan Deploy ulang sebagai versi baru ("New Version") di Google Apps Script.`);
    }
    if (data && data.error) {
      throw new Error(`Google Apps Script error: ${data.error}`);
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch ${table} from Google Sheets Web App:`, err);
    throw err;
  }
}

async function writeToGoogleSheet(table: string, action: 'write' | 'delete', data: any): Promise<boolean> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (!webappUrl) return false;
  try {
    const body: any = { action, table };
    if (action === 'write') {
      body.data = data;
    } else if (action === 'delete') {
      body.id = data.id || data;
    }

    const res = await fetch(webappUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error(`Gagal menulis ke Google Sheets untuk tabel ${table}. Respons yang diterima:`, text);
      throw new Error(`Google Sheets Web App mengembalikan respons tidak valid (halaman HTML bukan JSON). Harap pastikan Web App URL sudah benar, dideploy dengan akses "Anyone" (Siapa saja, bukan "Anyone with Google Account"), dan pastikan Anda sudah melakukan Deploy ulang sebagai versi baru ("New Version") di Google Apps Script.`);
    }
    return !!result.success;
  } catch (err) {
    console.error(`Failed to ${action} ${table} in Google Sheets Web App:`, err);
    throw err;
  }
}

async function uploadToGoogleDrive(base64Data: string, name: string, type: string): Promise<string | null> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (!webappUrl) {
    console.warn('Google Sheets Web App URL not set. Skipping Drive file upload.');
    return null;
  }
  try {
    let base64 = base64Data;
    if (base64.indexOf(';base64,') !== -1) {
      base64 = base64.split(';base64,')[1];
    }
    
    const body = {
      action: 'uploadFile',
      table: 'files',
      data: {
        base64,
        name,
        type
      }
    };
    
    console.log('Forwarding file upload to Google Sheets Web App. File name:', name);
    const res = await fetch(webappUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error('Google Sheets Web App upload file returned non-JSON response:', text);
      throw new Error(`Google Sheets Web App mengembalikan respons tidak valid saat mengunggah file. Harap pastikan Web App URL benar.`);
    }
    if (result && result.success) {
      console.log('File successfully uploaded to Google Drive. URL:', result.downloadUrl || result.url);
      return result.downloadUrl || result.url;
    } else {
      console.error('Failed to upload file to Google Drive. Web App response:', result);
      throw new Error(result?.error || 'Apps Script Web App gagal mengunggah file (success=false)');
    }
  } catch (err) {
    console.error('Error during Google Drive file upload:', err);
    throw err;
  }
}

function initLocalDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      users: defaultUsers,
      aspirasi: defaultAspirasi,
      pics: [],
      config: {
        googleSheetWebappUrl: ''
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    console.log('Local database seeded successfully in db.json');
  } else {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      let updated = false;
      if (!parsed.pics) {
        parsed.pics = [];
        updated = true;
      }
      if (!parsed.config) {
        parsed.config = {
          googleSheetWebappUrl: ''
        };
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Error ensuring pics and config in local DB:', e);
    }
  }
}

function readLocalDatabase() {
  // Guard against infinite recursion when getGoogleSheetWebappUrl calls readLocalDatabase
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      users: defaultUsers,
      aspirasi: defaultAspirasi,
      pics: [],
      config: {
        googleSheetWebappUrl: ''
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local database file, returning default structure', err);
    return { users: defaultUsers, aspirasi: defaultAspirasi, pics: [], config: { googleSheetWebappUrl: '' } };
  }
}

function writeLocalDatabase(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local database file', err);
  }
}

async function fetchUsers(): Promise<any[]> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      const list = await fetchFromGoogleSheet('users');
      return list || [];
    } catch (err) {
      console.error('Failed to fetch users from Google Sheets:', err);
      return [];
    }
  }
  return [];
}

async function fetchAspirasi(): Promise<any[]> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      const list = await fetchFromGoogleSheet('aspirasi');
      return list || [];
    } catch (err) {
      console.error('Failed to fetch aspirasi from Google Sheets:', err);
      return [];
    }
  }
  return [];
}

async function fetchPics(): Promise<any[]> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      const list = await fetchFromGoogleSheet('pics');
      if (list && list.length > 0) {
        return list;
      }
    } catch (err) {
      console.error('Failed to fetch PICs from Google Sheets Web App:', err);
    }
  }
  // Fallback to read-only PIC template if web app table is empty/errors
  try {
    return await fetchPicsFromGoogleSheet();
  } catch (err) {
    console.error('Failed to fetch PIC template:', err);
    return [];
  }
}

async function persistPic(pic: any): Promise<void> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      await writeToGoogleSheet('pics', 'write', pic);
      console.log('PIC persisted in Google Sheets:', pic.id);
    } catch (err) {
      console.error('Failed to persist PIC in Google Sheets:', err);
      throw err;
    }
  } else {
    throw new Error('Google Sheets Web App URL belum dikonfigurasi.');
  }
}

async function deletePic(id: string): Promise<void> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      await writeToGoogleSheet('pics', 'delete', { id });
      console.log('PIC deleted from Google Sheets:', id);
    } catch (err) {
      console.error('Failed to delete PIC from Google Sheets:', err);
      throw err;
    }
  } else {
    throw new Error('Google Sheets Web App URL belum dikonfigurasi.');
  }
}

async function persistUser(user: any): Promise<void> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      await writeToGoogleSheet('users', 'write', user);
      console.log(`Successfully persisted user ${user.email} in Google Sheets.`);
    } catch (err) {
      console.error(`Failed to persist user ${user.email} in Google Sheets:`, err);
      throw err;
    }
  } else {
    throw new Error('Google Sheets Web App URL belum dikonfigurasi.');
  }
}

async function persistAspirasi(item: any): Promise<void> {
  const webappUrl = getGoogleSheetWebappUrl();
  if (webappUrl) {
    try {
      await writeToGoogleSheet('aspirasi', 'write', item);
      console.log(`Successfully persisted aspirasi ${item.trackingCode} in Google Sheets.`);
    } catch (err) {
      console.error(`Failed to persist aspirasi ${item.trackingCode} in Google Sheets:`, err);
      throw err;
    }
  } else {
    throw new Error('Google Sheets Web App URL belum dikonfigurasi.');
  }
}

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Gemini Client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY not found in environment variables. Running in rule-based fallback mode.');
}

async function classifyWithAI(title: string, content: string): Promise<{ classification: 'ide' | 'kritik_saran'; topic: string; reason: string }> {
  const prompt = `Analisis aspirasi karyawan berikut.

Langkah 1: Klasifikasikan kategori utama:
- "ide" (usulan inovatif, gagasan baru, program baru, efisiensi baru)
- "kritik_saran" (keluhan, komplain, kritik terhadap fasilitas, masalah hubungan kerja, ketidaknyamanan)

Langkah 2: Tentukan sub-topik yang tepat dari daftar yang diizinkan sesuai dengan kategori utama:
Jika kategori adalah "kritik_saran", pilih salah satu topik ini:
- "Fasilitas"
- "Hubungan Kerja"
- "Lingkungan Kerja"
- "Human Happiness"
- "Peraturan & Kebijakan"
- "Sexual Harrasment"
- "Standar Kerja"

Jika kategori adalah "ide", pilih salah satu topik ini:
- "Produktivitas"
- "Quality"
- "Management System"
- "5S"
- "Human"
- "Environment"

Judul: "${title}"
Aspirasi: "${content}"

Berikan respon dalam format JSON dengan struktur:
{
  "classification": "ide" atau "kritik_saran",
  "topic": "nama topik yang sesuai",
  "reason": "Alasan singkat dan informatif dalam Bahasa Indonesia menjelaskan mengapa ini masuk kategori dan topik tersebut"
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: {
                type: Type.STRING,
                description: 'Must be either "ide" or "kritik_saran"',
              },
              topic: {
                type: Type.STRING,
                description: 'Must be exactly one of the allowed topics listed for the corresponding classification category.',
              },
              reason: {
                type: Type.STRING,
                description: 'Detailed explanation in Indonesian language of the classification decision.',
              },
            },
            required: ['classification', 'topic', 'reason'],
          },
        },
      });

      const text = response.text?.trim() || '';
      const parsed = JSON.parse(text);
      if (parsed.classification === 'ide' || parsed.classification === 'kritik_saran') {
        return {
          classification: parsed.classification,
          topic: parsed.topic || (parsed.classification === 'ide' ? 'Produktivitas' : 'Standar Kerja'),
          reason: parsed.reason
        };
      }
    } catch (e) {
      console.error('AI classification failed, falling back to rule-based', e);
    }
  }

  // Fallback rule-based classifier if Gemini is unavailable
  const combined = `${title.toLowerCase()} ${content.toLowerCase()}`;
  const ideaKeywords = [
    'bagaimana kalau', 'usul', 'ide', 'inovasi', 'bikin', 'aplikasi', 'portal', 'sistem baru',
    'mengusulkan', 'rekomendasi', 'bagaimana jika', 'buatkan', 'solusi', 'menghemat', 'meningkatkan'
  ];
  const isIdea = ideaKeywords.some(keyword => combined.includes(keyword));
  const classification = isIdea ? 'ide' : 'kritik_saran';

  let topic = '';
  if (isIdea) {
    if (combined.match(/5s|rapi|bersih|ringkas|rawat|rajin|seiri|seiton|seiso|seiketsu|shitsuke/)) {
      topic = '5S';
    } else if (combined.match(/lingkungan|sampah|pohon|hijau|karbon|alam|plastik|kertas|eco|daur ulang/)) {
      topic = 'Environment';
    } else if (combined.match(/sistem|manajemen|sop|kebijakan|prosedur|organisasi|birokrasi|struktur/)) {
      topic = 'Management System';
    } else if (combined.match(/kualitas|mutu|cacat|standar|quality|kontrol|rejection/)) {
      topic = 'Quality';
    } else if (combined.match(/orang|karyawan|pegawai|human|pelatihan|training|skil|kompetensi/)) {
      topic = 'Human';
    } else {
      topic = 'Produktivitas';
    }
  } else {
    if (combined.match(/pelecehan|seksual|goda|harassment|sexual|cabul|kontak fisik|tidak senonoh/)) {
      topic = 'Sexual Harrasment';
    } else if (combined.match(/gaji|bonus|libur|kebijakan|aturan|kontrak|cuti|jam kerja|absen|lembur|peraturan/)) {
      topic = 'Peraturan & Kebijakan';
    } else if (combined.match(/ac|meja|kursi|lampu|toilet|lift|pintu|parkir|kantor|gedung|fasilitas|internet|wifi|pc|laptop/)) {
      topic = 'Fasilitas';
    } else if (combined.match(/panas|bising|debu|bau|kotor|suasana|berisik|ventilasi|sekat|asap/)) {
      topic = 'Lingkungan Kerja';
    } else if (combined.match(/bos|atasan|rekan|teman|manager|komunikasi|bertengkar|marah|kelompok|tim/)) {
      topic = 'Hubungan Kerja';
    } else if (combined.match(/stres|lelah|jenuh|bahagia|mental|senang|happiness|sejahtera|kesejahteraan|work-life/)) {
      topic = 'Human Happiness';
    } else {
      topic = 'Standar Kerja';
    }
  }

  return {
    classification,
    topic,
    reason: isIdea
      ? `Terdeteksi sebagai Ide topik ${topic} secara otomatis berdasarkan kata kunci usulan/inovasi (Fallback Mode).`
      : `Terdeteksi sebagai Kritik/Saran topik ${topic} secara otomatis berdasarkan nada pelaporan atau keluhan (Fallback Mode).`
  };
}

initLocalDatabase();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

  // Diagnostic Endpoint for Cloud Status (repurposed to Google Sheets)
  app.get('/api/firebase-status', async (req, res) => {
    const webappUrl = getGoogleSheetWebappUrl();
    const status: any = {
      initialized: !!webappUrl,
      configLoaded: !!webappUrl,
      projectId: webappUrl ? 'Google Sheets Terkoneksi' : 'Lokal Offline',
      diagnostics: {
        canRead: false,
        canWrite: false,
        usersCount: 0
      }
    };

    if (webappUrl) {
      try {
        const users = await fetchFromGoogleSheet('users');
        status.diagnostics.usersCount = users.length;
        status.diagnostics.canRead = true;
        status.diagnostics.canWrite = true;
      } catch (err: any) {
        status.diagnostics.canRead = false;
        status.diagnostics.canWrite = false;
        status.diagnostics.readError = `Koneksi Google Sheets gagal: ${err.message || err.toString()}`;
      }
    }

    res.json(status);
  });

  // Force sync local fallback data into Google Sheets
  app.post('/api/admin/sync-local-to-cloud', async (req, res) => {
    const webappUrl = getGoogleSheetWebappUrl();
    if (!webappUrl) {
      return res.status(400).json({ error: 'Google Sheets Web App URL belum dikonfigurasi.' });
    }

    try {
      const local = readLocalDatabase();
      let usersSynced = 0;
      let aspirasiSynced = 0;
      let picsSynced = 0;

      if (local.users && local.users.length > 0) {
        for (const u of local.users) {
          await writeToGoogleSheet('users', 'write', u);
          usersSynced++;
        }
      }

      if (local.aspirasi && local.aspirasi.length > 0) {
        for (const a of local.aspirasi) {
          await writeToGoogleSheet('aspirasi', 'write', a);
          aspirasiSynced++;
        }
      }

      if (local.pics && local.pics.length > 0) {
        for (const p of local.pics) {
          await writeToGoogleSheet('pics', 'write', p);
          picsSynced++;
        }
      }

      res.json({
        message: 'Synchronized local fallback database to Google Sheets successfully!',
        synced: {
          users: usersSynced,
          aspirasi: aspirasiSynced,
          pics: picsSynced
        }
      });
    } catch (err: any) {
      console.error('Error during local-to-sheets sync:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Get dynamic server configuration
  app.get('/api/config', (req, res) => {
    try {
      const local = readLocalDatabase();
      res.json({
        googleSheetWebappUrl: local.config?.googleSheetWebappUrl || ''
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Save dynamic server configuration
  app.post('/api/config', (req, res) => {
    try {
      const { googleSheetWebappUrl } = req.body;
      const local = readLocalDatabase();
      if (!local.config) {
        local.config = {};
      }
      local.config.googleSheetWebappUrl = googleSheetWebappUrl || '';
      writeLocalDatabase(local);
      res.json({ message: 'Konfigurasi berhasil disimpan!', config: local.config });
    } catch (err: any) {
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Sync Local Database to Google Sheet Web App
  app.post('/api/admin/sync-to-sheet', async (req, res) => {
    const webappUrl = getGoogleSheetWebappUrl();
    if (!webappUrl) {
      return res.status(400).json({ error: 'Google Sheets Web App URL belum dikonfigurasi.' });
    }

    try {
      const local = readLocalDatabase();
      let usersSynced = 0;
      let aspirasiSynced = 0;
      let picsSynced = 0;

      if (local.users && local.users.length > 0) {
        for (const u of local.users) {
          await writeToGoogleSheet('users', 'write', u);
          usersSynced++;
        }
      }

      if (local.aspirasi && local.aspirasi.length > 0) {
        for (const a of local.aspirasi) {
          await writeToGoogleSheet('aspirasi', 'write', a);
          aspirasiSynced++;
        }
      }

      if (local.pics && local.pics.length > 0) {
        for (const p of local.pics) {
          await writeToGoogleSheet('pics', 'write', p);
          picsSynced++;
        }
      }

      res.json({
        message: 'Berhasil mensinkronisasikan seluruh data lokal ke Google Sheets!',
        synced: {
          users: usersSynced,
          aspirasi: aspirasiSynced,
          pics: picsSynced
        }
      });
    } catch (err: any) {
      console.error('Error syncing local to Google Sheets:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role, department, nik } = req.body;

    let finalEmail = email ? email.trim() : '';
    if (!finalEmail && nik) {
      finalEmail = `${nik.toString().trim()}@perusahaan.local`;
    }

    if (!finalEmail) {
      return res.status(400).json({ error: 'Email atau NIK wajib diisi untuk registrasi' });
    }

    if (!password || !name) {
      return res.status(400).json({ error: 'Nama, password, dan NIK/Email wajib diisi' });
    }

    const users = await fetchUsers();
    const existing = users.find((u: any) => 
      u.email.toLowerCase() === finalEmail.toLowerCase() ||
      (nik && u.nik && u.nik.toString().trim().toLowerCase() === nik.toString().trim().toLowerCase())
    );
    if (existing) {
      return res.status(400).json({ error: 'Email atau NIK sudah terdaftar di sistem' });
    }

    // Match with PICs in Google Sheet using 'nik'
    let finalRole = role || 'employee';
    let finalDepartment = department || 'Umum';
    let finalName = name;

    if (nik) {
      try {
        const picsList = await fetchPics();
        const cleanNik = nik.toString().trim().toLowerCase();
        const matchedPic = picsList.find((p: any) => p.nik && p.nik.toString().trim().toLowerCase() === cleanNik);
        if (matchedPic) {
          finalRole = 'pic';
          if (matchedPic.section) {
            finalDepartment = matchedPic.section;
          }
          if (matchedPic.name) {
            finalName = matchedPic.name;
          }
          console.log(`Automatic NIK PIC upgrade for registered user: NIK=${nik}, Role=${finalRole}, Name=${finalName}`);
        }
      } catch (err) {
        console.error('Failed to match PIC during registration:', err);
      }
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: finalEmail,
      password, // In a real app this would be hashed, we use plain text for simplicity in this demo
      name: finalName,
      role: finalRole,
      department: finalDepartment,
      nik: nik || '',
      createdAt: new Date().toISOString()
    };

    await persistUser(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Registrasi berhasil', user: userWithoutPassword });
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body; // email field may contain email or NIK

    if (!email || !password) {
      return res.status(400).json({ error: 'Email atau NIK dan password wajib diisi' });
    }

    const users = await fetchUsers();
    const cleanEmailOrNik = email.toString().trim().toLowerCase();
    
    const user = users.find((u: any) => 
      ((u.email && u.email.toLowerCase() === cleanEmailOrNik) ||
       (u.nik && u.nik.toString().trim().toLowerCase() === cleanEmailOrNik)) &&
      u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Email/NIK atau password salah' });
    }

    // Dynamic PIC update/check on login if user has a NIK
    if (user.nik) {
      try {
        const picsList = await fetchPics();
        const cleanNik = user.nik.toString().trim().toLowerCase();
        const matchedPic = picsList.find((p: any) => p.nik && p.nik.toString().trim().toLowerCase() === cleanNik);
        if (matchedPic && user.role !== 'pic') {
          user.role = 'pic';
          if (matchedPic.section) {
            user.department = matchedPic.section;
          }
          if (matchedPic.name) {
            user.name = matchedPic.name;
          }
          await persistUser(user);
          console.log(`Automatic NIK PIC upgrade for logged in user: NIK=${user.nik}, Name=${user.name}`);
        }
      } catch (err) {
        console.error('Failed to match PIC during login check:', err);
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login berhasil', user: userWithoutPassword });
  });

  // Submit Aspirasi / Feedback
  app.post('/api/aspirasi/submit', async (req, res) => {
    try {
      const { title, content, originalClassification, authorId, anonymous, fileBase64, fileName, fileType } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Judul dan isi aspirasi wajib diisi' });
      }

      // Call AI to classify
      const aiResult = await classifyWithAI(title, content);

      const users = await fetchUsers();
      let authorName = undefined;
      if (authorId && !anonymous) {
        const user = users.find((u: any) => u.id === authorId);
        if (user) authorName = user.name;
      }

      // Generate highly readable unique tracking code: ASP-[4 Random Digits]-[A-Z]{3}
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randStr = '';
      for (let i = 0; i < 3; i++) {
        randStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const trackingCode = `ASP-${randNum}-${randStr}`;

      // Upload file to Google Drive if present
      let photoUrl = '';
      let uploadWarning = '';
      if (fileBase64 && fileName && fileType) {
        try {
          const now = new Date();
          // Adjust to GMT+7 (WIB) for consistent datetime string
          const offset = 7 * 60; // WIB is UTC+7
          const localTime = new Date(now.getTime() + (now.getTimezoneOffset() + offset) * 60000);
          
          const yyyy = localTime.getFullYear();
          const mm = String(localTime.getMonth() + 1).padStart(2, '0');
          const dd = String(localTime.getDate()).padStart(2, '0');
          const hh = String(localTime.getHours()).padStart(2, '0');
          const min = String(localTime.getMinutes()).padStart(2, '0');
          const ss = String(localTime.getSeconds()).padStart(2, '0');
          
          // Get extension from fileType or original fileName
          let ext = '.png';
          if (fileType) {
            if (fileType.includes('jpeg') || fileType.includes('jpg')) {
              ext = '.jpg';
            } else if (fileType.includes('gif')) {
              ext = '.gif';
            }
          } else if (fileName && fileName.includes('.')) {
            ext = fileName.substring(fileName.lastIndexOf('.'));
          }
          
          const driveFileName = `ASPIRASI_${yyyy}${mm}${dd}_${hh}${min}${ss}${ext}`;
          const uploadedUrl = await uploadToGoogleDrive(fileBase64, driveFileName, fileType);
          if (uploadedUrl) {
            photoUrl = uploadedUrl;
          }
        } catch (err: any) {
          console.error('Failed to upload attachment to Google Drive:', err);
          uploadWarning = err.message || err.toString();
        }
      }

      const newAspirasi: any = {
        id: `asp-${Date.now()}`,
        trackingCode,
        title,
        content,
        originalClassification: originalClassification || 'kritik_saran',
        aiClassification: aiResult.classification,
        aiReason: aiResult.reason,
        topic: aiResult.topic,
        isPublic: false, // Default: false until compliance reviews
        isReviewed: false,
        status: 'submitted',
        authorId: anonymous ? null : (authorId || null),
        authorName: anonymous ? undefined : authorName,
        anonymous: !!anonymous,
        photoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressHistory: [
          {
            id: `log-${Date.now()}`,
            status: 'submitted',
            description: `Aspirasi berhasil diterima sistem.${photoUrl ? ' Lampiran foto berhasil diupload ke Google Drive.' : ''} Diklasifikasikan secara AI sebagai: ${aiResult.classification === 'ide' ? 'IDE (Gagasan Baru)' : 'KRITIK/SARAN'} dengan topik "${aiResult.topic}".`,
            updatedBy: 'Sistem AI',
            createdAt: new Date().toISOString()
          }
        ]
      };

      await persistAspirasi(newAspirasi);

      res.status(201).json({
        message: 'Aspirasi berhasil diajukan',
        data: newAspirasi,
        warning: uploadWarning || undefined
      });
    } catch (err: any) {
      console.error('Error submitting aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Get public approved feedback
  app.get('/api/aspirasi/public', async (req, res) => {
    try {
      const aspirasi = await fetchAspirasi();
      const publicList = aspirasi.filter((a: any) => a.isPublic === true);
      // Sort by newest
      publicList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(publicList);
    } catch (err: any) {
      console.error('Error fetching public aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Track submission by tracking code
  app.get('/api/aspirasi/track/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const aspirasi = await fetchAspirasi();
      const item = aspirasi.find((a: any) => a.trackingCode.toLowerCase() === code.trim().toLowerCase());
      if (!item) {
        return res.status(404).json({ error: 'Kode pelacakan tidak ditemukan' });
      }
      res.json(item);
    } catch (err: any) {
      console.error('Error tracking aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Get user's own submissions
  app.get('/api/aspirasi/my', async (req, res) => {
    try {
      const authorId = req.query.authorId as string;
      if (!authorId) {
        return res.status(400).json({ error: 'ID Pengguna wajib disertakan' });
      }

      const aspirasi = await fetchAspirasi();
      const myList = aspirasi.filter((a: any) => a.authorId === authorId);
      myList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(myList);
    } catch (err: any) {
      console.error('Error fetching my aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Admin/Compliance: Get all submissions
  app.get('/api/aspirasi/all', async (req, res) => {
    try {
      const aspirasi = await fetchAspirasi();
      // Sort by newest
      const all = [...aspirasi].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(all);
    } catch (err: any) {
      console.error('Error fetching all aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Compliance Action: Review & Publish/Unpublish
  app.put('/api/aspirasi/:id/review', async (req, res) => {
    try {
      const { id } = req.params;
      const { isPublic, reviewerName } = req.body;

      const aspirasi = await fetchAspirasi();
      const index = aspirasi.findIndex((a: any) => a.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Aspirasi tidak ditemukan' });
      }

      const item = aspirasi[index];
      item.isPublic = !!isPublic;
      item.isReviewed = true;
      item.updatedAt = new Date().toISOString();

      // If status was 'submitted', automatically advance it to 'reviewed'
      if (item.status === 'submitted') {
        item.status = 'reviewed';
        item.progressHistory.push({
          id: `log-${Date.now()}`,
          status: 'reviewed',
          description: `Telah ditinjau oleh Kepatuhan. Status publikasi disetujui: ${isPublic ? 'Bisa Dilihat Publik' : 'Hanya Pengirim / Private'}.`,
          updatedBy: reviewerName || 'Sarah Amalia (Compliance)',
          createdAt: new Date().toISOString()
        });
      } else {
        item.progressHistory.push({
          id: `log-${Date.now()}`,
          status: item.status,
          description: `Pengaturan visibilitas diubah oleh Kepatuhan menjadi: ${isPublic ? 'Publik' : 'Privat'}.`,
          updatedBy: reviewerName || 'Sarah Amalia (Compliance)',
          createdAt: new Date().toISOString()
        });
      }

      await persistAspirasi(item);

      res.json({ message: 'Review berhasil disimpan', data: item });
    } catch (err: any) {
      console.error('Error reviewing aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // Compliance or PIC Action: Assign PIC & Update Status
  app.put('/api/aspirasi/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        status, 
        picName, 
        picDepartment, 
        description, 
        updatedBy, 
        feedback, 
        correctiveAction, 
        targetCompletionDate,
        feedbackPhotoBase64,
        feedbackPhotoName,
        feedbackPhotoType
      } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status wajib ditentukan' });
      }

      const aspirasi = await fetchAspirasi();
      const index = aspirasi.findIndex((a: any) => a.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Aspirasi tidak ditemukan' });
      }

      const item = aspirasi[index];

      // Track original status to verify change
      const oldStatus = item.status;
      item.status = status;

      // Handle optional feedback photo upload
      let uploadedFeedbackPhotoUrl = '';
      if (feedbackPhotoBase64 && feedbackPhotoName && feedbackPhotoType) {
        console.log(`Uploading feedback photo to Google Drive: ${feedbackPhotoName}...`);
        try {
          const url = await uploadToGoogleDrive(feedbackPhotoBase64, feedbackPhotoName, feedbackPhotoType);
          if (url) {
            uploadedFeedbackPhotoUrl = url;
            item.feedbackPhotoUrl = url;
            console.log('Feedback photo uploaded successfully:', url);
          }
        } catch (uploadErr) {
          console.error('Error uploading feedback photo:', uploadErr);
        }
      }
      if (picName) {
        item.picName = picName;
      }
      if (picDepartment) {
        item.picDepartment = picDepartment;
      }
      if (feedback !== undefined) {
        item.feedback = feedback;
      }
      if (correctiveAction !== undefined) {
        item.correctiveAction = correctiveAction;
      }
      if (targetCompletionDate !== undefined) {
        item.targetCompletionDate = targetCompletionDate;
      }
      item.updatedAt = new Date().toISOString();

      // Create readable status log description if none is provided
      let logDesc = description || '';
      if (!logDesc) {
        const statusLabels: Record<string, string> = {
          submitted: 'Diajukan',
          reviewed: 'Ditinjau Kepatuhan',
          in_progress: 'Ditindaklanjuti PIC',
          management: 'Ditinjau Manajemen Puncak',
          resolved: 'Selesai / Selesai Ditangani'
        };
        logDesc = `Status diperbarui dari ${statusLabels[oldStatus] || oldStatus} ke ${statusLabels[status] || status}.`;
        if (picName) {
          logDesc += ` Penanggung Jawab (PIC): ${picName} (${picDepartment || 'IT Operations'}).`;
        }
      }

      if (feedback) {
        logDesc += `\nFeedback: ${feedback}`;
      }
      if (correctiveAction) {
        logDesc += `\nCorrective Action: ${correctiveAction}`;
      }
      if (targetCompletionDate) {
        const formattedDate = new Date(targetCompletionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        logDesc += `\nTarget Selesai: ${formattedDate}`;
      }

      const newLog: any = {
        id: `log-${Date.now()}`,
        status,
        description: logDesc,
        updatedBy: updatedBy || 'Sistem',
        createdAt: new Date().toISOString()
      };
      if (uploadedFeedbackPhotoUrl) {
        newLog.feedbackPhotoUrl = uploadedFeedbackPhotoUrl;
      }
      item.progressHistory.push(newLog);

      await persistAspirasi(item);

      res.json({ message: 'Status berhasil diperbarui', data: item });
    } catch (err: any) {
      console.error('Error updating status for aspirasi:', err);
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  // --- PIC DATABASE API ---
  app.get('/api/pics', async (req, res) => {
    try {
      const list = await fetchPics();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat database PIC' });
    }
  });

  app.post('/api/pics', async (req, res) => {
    try {
      const pic = req.body;
      if (!pic.nik || !pic.name) {
        return res.status(400).json({ error: 'NIK dan Nama wajib diisi' });
      }
      if (!pic.id) {
        pic.id = `pic-${pic.nik.replace(/\s+/g, '-').toLowerCase()}`;
      }
      pic.updatedAt = new Date().toISOString();
      await persistPic(pic);
      res.json({ message: 'Data PIC berhasil disimpan', data: pic });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menyimpan data PIC' });
    }
  });

  app.delete('/api/pics/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deletePic(id);
      res.json({ message: 'Data PIC berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus data PIC' });
    }
  });

  app.post('/api/pics/sync', async (req, res) => {
    try {
      console.log('Manual PIC sync requested from client...');
      const sheetPics = await fetchPicsFromGoogleSheet();
      if (sheetPics.length === 0) {
        return res.status(500).json({ error: 'Gagal mengunduh data atau data kosong dari Google Sheets' });
      }
      
      // Update local and firestore for each pic in the sheet
      for (const p of sheetPics) {
        await persistPic(p);
      }
      
      const updatedList = await fetchPics();
      res.json({ message: `Berhasil sinkronisasi ${sheetPics.length} data PIC dari Google Sheets!`, data: updatedList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal melakukan sinkronisasi Google Sheets' });
    }
  });

  
async function startServer() {

  // --- VITE MIDDLEWARE / STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    // Bypass bundler static analysis for vite
    const viteModule = 'vite';
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
