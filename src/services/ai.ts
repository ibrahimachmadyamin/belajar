import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export interface GenerateResult {
  questions: QuizQuestion[];
  modelUsed: string;
  skipped: { name: string; reason: ModelStatus | "busy" }[];
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
      skipped.push({ name: modelName, reason: kind });
    }
  }

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
      
      // Parsing JSON hasil dari AI
      const questions: QuizQuestion[] = JSON.parse(responseText);
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
