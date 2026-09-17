import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { QuizQuestion } from './ai';

const { StorageAccessFramework } = FileSystem;
const DIRECTORY_URI_KEY = '@quiz_directory_uri';

export interface LocalQuestion extends QuizQuestion {
  id: string;
}

// 1. Meminta Izin Akses Folder ke Pengguna
export const requestFolderPermission = async (): Promise<string | null> => {
  try {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      await AsyncStorage.setItem(DIRECTORY_URI_KEY, permissions.directoryUri);
      return permissions.directoryUri;
    }
    return null;
  } catch (error: any) {
    console.error("Error requesting permission:", error);
    throw new Error(error.message || "Gagal membuka sistem file Android.");
  }
};

// 2. Mendapatkan URI Folder yang Tersimpan
export const getSavedFolderUri = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(DIRECTORY_URI_KEY);
  } catch (error) {
    return null;
  }
};

// 3. Menyimpan Soal Baru ke File JSON
export const saveQuestionsLocally = async (newQuestions: QuizQuestion[]): Promise<number> => {
  const directoryUri = await getSavedFolderUri();
  
  if (!directoryUri) {
    throw new Error("Folder penyimpanan belum dipilih. Silakan ke Bank Soal untuk memilih folder.");
  }

  try {
    // Generate nama file unik berdasarkan waktu
    const filename = `soal_kuis_${Date.now()}`;
    
    // Buat file kosong di folder tersebut
    const fileUri = await StorageAccessFramework.createFileAsync(
      directoryUri, 
      filename, 
      'application/json'
    );
    
    // Siapkan data dengan ID
    const questionsToSave: LocalQuestion[] = newQuestions.map((q, i) => ({
      ...q,
      id: `${Date.now()}_${i}`
    }));
    
    // Tulis data ke file tersebut
    await StorageAccessFramework.writeAsStringAsync(fileUri, JSON.stringify(questionsToSave, null, 2));
    
    return questionsToSave.length;
  } catch (error) {
    console.error("Error saving to SAF:", error);
    throw new Error("Gagal menyimpan file ke folder. Pastikan folder masih ada dan belum dihapus.");
  }
};

// 4. Membaca SEMUA File JSON di Folder
export const getLocalQuestions = async (): Promise<LocalQuestion[]> => {
  const directoryUri = await getSavedFolderUri();
  if (!directoryUri) return [];

  let allQuestions: LocalQuestion[] = [];

  try {
    const files = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    
    for (const fileUri of files) {
      // Hanya baca file yang ujungnya .json atau application/json
      if (fileUri.endsWith('.json') || fileUri.includes('%2Fjson') || fileUri.includes('json')) {
        try {
          const content = await StorageAccessFramework.readAsStringAsync(fileUri);
          const parsed = JSON.parse(content);
          
          if (Array.isArray(parsed)) {
            // Validasi sederhana: apakah object ini punya "question" dan "options"
            if (parsed.length > 0 && parsed[0].question && parsed[0].options) {
              allQuestions = [...allQuestions, ...parsed];
            }
          }
        } catch (e) {
          console.warn("Gagal membaca file:", fileUri);
        }
      }
    }
    return allQuestions;
  } catch (error) {
    console.error("Error reading directory:", error);
    return [];
  }
};
