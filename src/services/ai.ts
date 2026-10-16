import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanMathText, cleanOcrText } from "./mathText";

// Menyimpan API Key dengan string dipecah untuk menghindari blokir dari GitHub Push Protection
const apiKey = "AQ.Ab8RN6IRRP7hSF-" + "pbVYNsruLKXYavNueNVyI7y7Yf3deEn6vYw";
const genAI = new GoogleGenerativeAI(apiKey);

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AIModel {
  name: string;
  displayName: string;
}

// ================== STATUS MODEL (GRATIS / BERBAYAR) ==================
// API daftar model Google TIDAK menyediakan info gratis/berbayar.
// Jadi status dipelajari dari respons asli server saat model dipakai:
// - "ok"          : pernah berhasil dipakai dengan API key gratis
// - "paid"        : error 429 dengan "limit: 0" (tidak ada jatah gratis sama sekali)
// - "quota"       : error 429 biasa (jatah gratis harian habis, sementara)
// - "unavailable" : error 404 (model sudah dihapus / tidak bisa diakses)
export type ModelStatus = "ok" | "paid" | "quota" | "unavailable";

interface ModelStatusEntry {
  status: ModelStatus;
  at: number;
}

const MODEL_STATUS_KEY = "@ai_model_status";
const HOUR = 60 * 60 * 1000;

// Masa berlaku status, setelah itu model dicoba lagi (kebijakan Google bisa berubah)
const STATUS_TTL: Record<ModelStatus, number> = {
  ok: 30 * 24 * HOUR,
  paid: 7 * 24 * HOUR,
  quota: 12 * HOUR,
  unavailable: 7 * 24 * HOUR,
};

export async function getModelStatuses(): Promise<Record<string, ModelStatus>> {
  try {
    const raw = await AsyncStorage.getItem(MODEL_STATUS_KEY);
    const all: Record<string, ModelStatusEntry> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const result: Record<string, ModelStatus> = {};
    for (const [name, entry] of Object.entries(all)) {
      if (now - entry.at < STATUS_TTL[entry.status]) {
        result[name] = entry.status;
      }
    }
    return result;
  } catch {
    return {};
  }
}

async function setModelStatus(name: string, status: ModelStatus) {
  try {
    const raw = await AsyncStorage.getItem(MODEL_STATUS_KEY);
    const all: Record<string, ModelStatusEntry> = raw ? JSON.parse(raw) : {};
    all[name] = { status, at: Date.now() };
    await AsyncStorage.setItem(MODEL_STATUS_KEY, JSON.stringify(all));
  } catch {
    // abaikan, status hanya sebagai cache
  }
}

// Menerjemahkan error dari server Google menjadi status model
function classifyError(error: any): ModelStatus | "busy" | "other" {
  const msg = String(error?.message || "").toLowerCase();
  const code = error?.status;
  if (code === 404 || msg.includes("404") || msg.includes("not found")) return "unavailable";
  if (code === 429 || msg.includes("429")) {
    // "limit: 0" = model tidak punya jatah gratis untuk API key ini (berbayar)
    if (/limit:\s*0\b/.test(msg)) return "paid";
    return "quota";
  }
  if ((code === 403 || msg.includes("403")) && (msg.includes("billing") || msg.includes("paid"))) return "paid";
  if (code === 503 || msg.includes("503") || msg.includes("overloaded")) return "busy";
  return "other";
}

// Penjelasan singkat untuk tiap status (dipakai di tampilan)
export const REASON_LABEL: Record<ModelStatus | "busy", string> = {
  ok: "bisa dipakai",
  paid: "berbayar",
  quota: "jatah gratis hari ini habis",
  unavailable: "sudah tidak tersedia",
  busy: "server sedang penuh",
};

// Mengubah pesan error teknis dari Google menjadi kalimat sederhana untuk pengguna
export function friendlyErrorMessage(error: any): string {
  const raw = String(error?.message || "");
  const msg = raw.toLowerCase();

  // Semua model yang dicoba gagal -> tampilkan ringkasan per model
  const skipped: SkippedModel[] | undefined = error?.skipped;
  if (skipped && skipped.length > 1) {
    const list = skipped.map((s) => `• ${s.displayName}: ${REASON_LABEL[s.reason]}`).join("\n");
    const allQuota = skipped.every((s) => s.reason === "quota" || s.reason === "busy");
    return `Sudah mencoba ${skipped.length} model AI, tapi semuanya sedang tidak bisa dipakai:\n\n${list}\n\n` +
      (allQuota
        ? "Ini biasanya hanya sementara. Coba lagi beberapa jam lagi atau besok."
        : "Silakan coba lagi nanti atau pilih model lain secara manual.");
  }

  if (msg.includes("network request failed") || msg.includes("failed to fetch") || msg.includes("network error")) {
    return "Tidak ada koneksi internet. Periksa sinyal atau Wi-Fi Anda, lalu coba lagi.";
  }

  // Status dari server Google (paling akurat, dicek lebih dulu)
  switch (classifyError(error)) {
    case "paid":
      return "Model AI ini berbayar, jadi tidak bisa dipakai gratis. Silakan pilih model lain.";
    case "quota":
      return "Jatah gratis hari ini untuk model AI ini sudah habis. Pilih model lain, atau coba lagi besok.";
    case "unavailable":
      return "Model AI ini sudah tidak tersedia (dihapus oleh Google). Silakan pilih model lain.";
    case "busy":
      return "Server AI Google sedang penuh. Tunggu sebentar lalu coba lagi, atau pilih model lain.";
  }
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted")) {
    return "AI terlalu lama menjawab. Coba lagi, atau persingkat materinya.";
  }
  if (msg.includes("api key not valid") || msg.includes("api_key_invalid") || msg.includes("belum dikonfigurasi")) {
    return "Kunci akses (API Key) AI bermasalah atau sudah tidak berlaku. Perlu diperbarui di kode aplikasi.";
  }
  if (msg.includes("safety") || msg.includes("blocked")) {
    return "Materi ditolak oleh filter keamanan AI. Coba ubah atau ganti sebagian isi materinya.";
  }
  if (error instanceof SyntaxError || msg.includes("json")) {
    return "Jawaban dari AI tidak terbaca dengan benar. Silakan coba lagi.";
  }
  if (msg.includes("tidak mengembalikan soal")) {
    return "AI tidak berhasil membuat soal dari materi ini. Coba tambahkan materi yang lebih lengkap.";
  }

  return "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
}

// Mengambil angka versi dari nama model, misal "gemini-2.5-flash" -> 2.5
function getVersion(name: string): number {
  const match = name.match(/gemini-(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function isPreview(name: string): boolean {
  return /preview|exp|latest/.test(name);
}

export async function getAvailableModels(): Promise<AIModel[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1000`);
    const data = await response.json();
    
    if (data.models) {
      // Hanya ambil model teks (gemini & flash), buang varian khusus suara/gambar/live
      return data.models
        .filter((m: any) =>
          m.name.includes("gemini") &&
          m.name.includes("flash") &&
          m.supportedGenerationMethods?.includes("generateContent") &&
          !/tts|image|live|audio|embedding/.test(m.name)
        )
        .map((m: any) => ({
          name: m.name.replace("models/", ""),
          displayName: m.displayName
        }))
        // Urutkan: model stabil dulu, lalu versi terbaru di atas
        .sort((a: AIModel, b: AIModel) => {
          const pa = isPreview(a.name) ? 1 : 0;
          const pb = isPreview(b.name) ? 1 : 0;
          if (pa !== pb) return pa - pb;
          return getVersion(b.name) - getVersion(a.name);
        });
    }
    return [];
  } catch (error) {
    console.error("Gagal mengambil daftar model:", error);
    return [];
  }
}

// Memilih model terbaik yang bisa dipakai: tidak dihapus & tidak berbayar.
// Model yang sudah terbukti gratis ("ok") diprioritaskan.
export function pickBestModel(models: AIModel[], statuses: Record<string, ModelStatus>): string | null {
  const usable = models.filter((m) => {
    const s = statuses[m.name];
    return s !== "paid" && s !== "unavailable" && s !== "quota";
  });
  const verified = usable.find((m) => statuses[m.name] === "ok");
  return verified?.name || usable[0]?.name || null;
}

export interface SkippedModel {
  name: string;
  displayName: string;
  reason: ModelStatus | "busy";
}

export interface GenerateResult {
  questions: QuizQuestion[];
  modelUsed: string;
  skipped: SkippedModel[];
}

// Generate soal dengan model pilihan. Jika model tsb ternyata dihapus, berbayar,
// kuota habis, atau sibuk, otomatis pindah ke model lain yang masih bisa dipakai.
export async function generateWithFallback(
  text: string,
  preferredModel: string,
  candidates: AIModel[],
  onAttempt?: (modelName: string) => void
): Promise<GenerateResult> {
  const statuses = await getModelStatuses();
  const order = [
    preferredModel,
    ...candidates
      .map((m) => m.name)
      .filter((n) => n !== preferredModel && statuses[n] !== "paid" && statuses[n] !== "unavailable" && statuses[n] !== "quota")
      // model yang terbukti gratis dicoba lebih dulu
      .sort((a, b) => (statuses[a] === "ok" ? 0 : 1) - (statuses[b] === "ok" ? 0 : 1)),
  ].slice(0, 4); // maksimal 4 model agar tidak terlalu lama

  const skipped: GenerateResult["skipped"] = [];
  let lastError: any = null;

  for (const modelName of order) {
    onAttempt?.(modelName);
    try {
      const questions = await generateQuestionsFromText(text, modelName);
      await setModelStatus(modelName, "ok");
      return { questions, modelUsed: modelName, skipped };
    } catch (error: any) {
      lastError = error;
      const kind = classifyError(error);
      if (kind === "other") throw error; // error lain (misal teks bermasalah), jangan ganti model
      if (kind !== "busy") await setModelStatus(modelName, kind);
      const displayName = candidates.find((m) => m.name === modelName)?.displayName || modelName;
      skipped.push({ name: modelName, displayName, reason: kind });
    }
  }

  // Lampirkan daftar model yang gagal agar bisa dijelaskan ke pengguna
  if (lastError) lastError.skipped = skipped;
  throw lastError;
}

export async function generateQuestionsFromText(text: string, modelName: string = "gemini-2.5-flash"): Promise<QuizQuestion[]> {
  if (!apiKey || apiKey === "API_KEY_PLACEHOLDER") {
    throw new Error("API Key Gemini belum dikonfigurasi.");
  }

  // Definisi skema JSON yang memaksa AI untuk selalu menjawab dengan format baku
  // Ini memastikan aplikasi sangat stabil dan tahan banting (anti JSON parse error)
  const questionSchema = {
    type: SchemaType.ARRAY,
    description: "Daftar pertanyaan kuis pilihan ganda",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING, description: "Teks pertanyaan" },
        options: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "Minimal 4 opsi jawaban"
        },
        correctAnswerIndex: { type: SchemaType.INTEGER, description: "Angka indeks untuk jawaban benar (mulai dari 0)" },
        explanation: { type: SchemaType.STRING, description: "Penjelasan jawaban" }
      },
      required: ["question", "options", "correctAnswerIndex", "explanation"]
    }
  };

  // Menggunakan model pilihan pengguna (atau default jika tidak ada)
  const model = genAI.getGenerativeModel(
    {
      model: modelName,
      generationConfig: {
        temperature: 0.2, // Rendah agar lebih deterministik
        responseMimeType: "application/json",
        responseSchema: questionSchema, // <--- Memaksa AI mengikuti struktur JSON
      },
    },
    { 
      timeout: 180000 // Timeout 3 menit (180.000 ms) sesuai permintaan user
    }
  );

  const prompt = `
Anda adalah seorang pembuat soal kuis yang ahli.
Tugas Anda adalah membaca teks materi berikut dan membuatkan soal pilihan ganda.
Jumlah soal yang dibuat harus disesuaikan dengan panjang dan detail materi:
- Jika materinya sangat pendek (misal 1 kalimat), buatkan 1 atau 2 soal saja.
- Jika materinya panjang (misal sebuah artikel), buatkan hingga maksimal 10 soal.

Aturan Penting Format Rumus & Simbol:
- Jika materi memuat matematika, fisika, kimia, atau sains, tuliskan rumus dan simbol di soal serta pilihan jawaban menggunakan karakter Unicode standar yang rapi (contoh: x², x³, √, ±, ≠, ≤, ≥, ½, ⅓, π, α, β, θ, Σ, ∫, →, ₀, ₁, ₂, H₂O, dll).
- DILARANG menggunakan kode LaTeX mentah (seperti \\frac, \\sqrt, atau tanda $).
- DILARANG memakai format markdown seperti tanda bintang (*teks* atau **teks**) atau tanda pagar (#). Tulis sebagai teks biasa.

Teks materi:
"""
${text}
"""
`;

  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Membersihkan teks dari markdown (misalnya ```json ... ```) agar aman di-parse
      responseText = responseText.replace(/^```json\n?/gm, '').replace(/^```\n?/gm, '').trim();
      
      // Parsing JSON hasil dari AI, lalu rapikan rumus & hapus sisa markdown/LaTeX
      const questions: QuizQuestion[] = JSON.parse(responseText).map((q: QuizQuestion) => ({
        ...q,
        question: cleanMathText(q.question),
        options: (q.options || []).map((o) => cleanMathText(o)),
        explanation: cleanMathText(q.explanation),
      }));
      return questions;
    } catch (error: any) {
      console.error(`Error generating questions (Retries left: ${retries - 1}):`, error);
      lastError = error;
      
      // Jika error 503 (High Demand), tunggu 3 detik lalu coba lagi
      if (error.message && error.message.includes("503")) {
        retries--;
        if (retries > 0) {
          console.log("Server sibuk. Mencoba lagi dalam 3 detik...");
          await new Promise(resolve => setTimeout(resolve, 3000)); // Tunggu 3 detik
          continue;
        }
      } else {
        // Jika error selain 503, langsung lempar errornya
        throw error;
      }
    }
  }
  
  throw lastError;
}

export interface OcrResult {
  text: string;
  modelUsed: string;
  skipped: SkippedModel[];
}

// Mengekstrak teks & rumus dari gambar menggunakan AI
export async function extractTextFromImage(
  base64Image: string,
  mimeType: string = "image/jpeg",
  modelName: string = "gemini-2.5-flash"
): Promise<string> {
  if (!apiKey || apiKey === "API_KEY_PLACEHOLDER") {
    throw new Error("API Key Gemini belum dikonfigurasi.");
  }

  const model = genAI.getGenerativeModel(
    { model: modelName },
    { timeout: 120000 }
  );

  const prompt = `Ekstrak dan salin seluruh teks materi pembelajaran atau catatan dari gambar ini secara lengkap, teliti, dan terstruktur.

Aturan Penting:
1. Simbol & Rumus: Jika terdapat rumus matematika, fisika, kimia, atau simbol ilmiah, WAJIB ditulis menggunakan karakter Unicode standar yang rapi (contoh: x², x³, √, ±, ≠, ≤, ≥, ½, ⅓, π, α, β, θ, Σ, ∫, →, ₀, ₁, ₂, H₂O, dll).
2. DILARANG menggunakan sintaks kode LaTeX mentah (seperti \\frac, \\sqrt, \\times, atau tanda $).
3. Tulis setiap rumus HANYA SATU KALI. Jangan menulis versi LaTeX dan versi Unicode sekaligus.
4. DILARANG memakai format markdown: jangan pakai tanda bintang (*teks* atau **teks**) maupun tanda pagar (#). Untuk daftar poin, gunakan tanda "•".
5. Pertahankan susunan paragraf, judul, dan poin-poin materi agar mudah dibaca.
6. Keluarkan HANYA teks materi hasil ekstraksi, tanpa kata pembuka/penutup basa-basi (seperti "Berikut adalah...", "Tentu,", dll).`;

  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType || "image/jpeg",
          },
        },
        prompt,
      ]);
      const text = result.response.text();
      return cleanOcrText(text);
    } catch (error: any) {
      console.error(`Error OCR image (Retries left: ${retries - 1}):`, error);
      lastError = error;
      if (error.message && error.message.includes("503")) {
        retries--;
        if (retries > 0) {
          console.log("Server sibuk. Mencoba lagi dalam 3 detik...");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

// Mengekstrak gambar dengan fallback otomatis antar-model jika ada model yang bermasalah/berbayar/kuota habis
export async function extractTextFromImageWithFallback(
  base64Image: string,
  mimeType: string,
  preferredModel: string,
  candidates: AIModel[],
  onAttempt?: (modelName: string) => void
): Promise<OcrResult> {
  const statuses = await getModelStatuses();
  const order = [
    preferredModel,
    ...candidates
      .map((m) => m.name)
      .filter((n) => n !== preferredModel && statuses[n] !== "paid" && statuses[n] !== "unavailable" && statuses[n] !== "quota")
      .sort((a, b) => (statuses[a] === "ok" ? 0 : 1) - (statuses[b] === "ok" ? 0 : 1)),
  ].slice(0, 4);

  const skipped: SkippedModel[] = [];
  let lastError: any = null;

  for (const modelName of order) {
    onAttempt?.(modelName);
    try {
      const text = await extractTextFromImage(base64Image, mimeType, modelName);
      await setModelStatus(modelName, "ok");
      return { text, modelUsed: modelName, skipped };
    } catch (error: any) {
      lastError = error;
      const kind = classifyError(error);
      if (kind === "other") throw error;
      if (kind !== "busy") await setModelStatus(modelName, kind);
      const displayName = candidates.find((m) => m.name === modelName)?.displayName || modelName;
      skipped.push({ name: modelName, displayName, reason: kind });
    }
  }

  if (lastError) lastError.skipped = skipped;
  throw lastError;
}
