import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKey } from '../config/storage';

const getGenAI = async () => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API Key belum diatur. Silakan masukkan di halaman Settings.');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Fungsi untuk merapikan teks materi
export const processMaterial = async (rawText: string) => {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Menggunakan model 2.5 Pro seperti request

  const prompt = `
  Anda adalah asisten cerdas untuk aplikasi pembelajaran.
  Saya akan memberikan teks materi mentah. Tugas Anda adalah:
  1. Merapikan teks tersebut (perbaiki salah ketik, tanda baca, dll).
  2. Ekstrak informasi penting.
  3. Berikan judul yang sesuai.
  4. Tentukan topik atau kategorinya.
  
  Kembalikan hasil dalam format JSON yang valid seperti ini tanpa markdown backticks:
  {
    "title": "Judul Materi",
    "topic": "Topik Materi",
    "content": "Teks yang sudah dirapikan dan padat"
  }
  
  Materi mentah:
  ${rawText}
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    // Mencoba parsing JSON (Gemini biasanya mengembalikan dalam markdown json)
    const cleanedText = response.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gagal parsing JSON dari AI", error);
    throw new Error('AI mengembalikan format yang tidak valid.');
  }
};

// Fungsi untuk mengekstrak dan merangkum dokumen (PDF/Word)
export const processDocument = async (base64Data: string, mimeType: string) => {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
  Anda adalah asisten cerdas. Saya melampirkan sebuah dokumen.
  Tugas Anda adalah memindai seluruh isinya, memahaminya, lalu:
  1. Buatlah rangkuman yang sangat komprehensif namun padat dari dokumen ini.
  2. Ekstrak informasi dan poin-poin penting agar mudah dipelajari.
  3. Berikan judul yang sesuai.
  4. Tentukan topik atau kategorinya.
  
  Kembalikan hasil HANYA dalam format JSON yang valid seperti ini tanpa markdown backticks:
  {
    "title": "Judul Dokumen",
    "topic": "Topik Dokumen",
    "content": "Rangkuman lengkap dan rapi dari isi dokumen"
  }
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType } }
  ]);
  const response = result.response.text();
  
  try {
    const cleanedText = response.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gagal parsing JSON dari AI Dokumen", error);
    throw new Error('AI mengembalikan format yang tidak valid dari dokumen.');
  }
};

// Fungsi untuk generate kuis
export const generateQuiz = async (materialContent: string) => {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
  Buat 5 soal pilihan ganda berdasarkan materi berikut.
  
  Kembalikan dalam format JSON murni (array of objects) tanpa awalan markdown seperti ini:
  [
    {
      "question": "Pertanyaan 1?",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "Penjelasan kenapa A benar"
    }
  ]
  
  Materi:
  ${materialContent}
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const cleanedText = response.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gagal parsing Kuis dari AI", error);
    throw new Error('AI mengembalikan format kuis yang tidak valid.');
  }
};
