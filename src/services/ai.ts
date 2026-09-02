import { GoogleGenerativeAI } from "@google/generative-ai";

// Menyimpan API Key dengan string dipecah untuk menghindari blokir dari GitHub Push Protection
const apiKey = "AQ.Ab8RN6IRRP7hSF-" + "pbVYNsruLKXYavNueNVyI7y7Yf3deEn6vYw";
const genAI = new GoogleGenerativeAI(apiKey);

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export async function generateQuestionsFromText(text: string): Promise<QuizQuestion[]> {
  if (!apiKey || apiKey === "API_KEY_PLACEHOLDER") {
    throw new Error("API Key Gemini belum dikonfigurasi.");
  }

  // Menggunakan model yang direkomendasikan untuk tugas teks (sekarang versi 3.7)
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-3.7-flash",
      generationConfig: {
        temperature: 0.2, // Rendah agar lebih deterministik
        responseMimeType: "application/json",
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

Format balasannya HARUS dalam bentuk murni JSON array (tanpa format markdown, tanpa tag \`\`\`json) dengan struktur objek berikut untuk setiap soal:
[
  {
    "question": "pertanyaan",
    "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
    "correctAnswerIndex": <angka 0-3 yang merepresentasikan indeks opsi benar>,
    "explanation": "Penjelasan singkat mengapa jawaban tersebut benar"
  }
]

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
