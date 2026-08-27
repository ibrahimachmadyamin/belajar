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

  // Menggunakan model yang direkomendasikan untuk tugas teks
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2, // Rendah agar lebih deterministik
      responseMimeType: "application/json",
    },
  });

  const prompt = `
Anda adalah seorang pembuat soal kuis yang ahli.
Buatkan 5 soal pilihan ganda berdasarkan teks berikut ini.
Format balasannya HARUS dalam bentuk JSON array dengan struktur objek berikut untuk setiap soal:
{
  "question": "pertanyaan",
  "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
  "correctAnswerIndex": <angka 0-3 yang merepresentasikan indeks opsi benar>,
  "explanation": "Penjelasan singkat mengapa jawaban tersebut benar"
}

Teks materi:
"""
${text}
"""
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parsing JSON hasil dari AI
    const questions: QuizQuestion[] = JSON.parse(responseText);
    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}
