import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizQuestion } from './ai';

const QUESTIONS_KEY = '@quiz_questions';

export interface LocalQuestion extends QuizQuestion {
  id: string;
  createdAt: number;
}

export const saveQuestionsLocally = async (newQuestions: QuizQuestion[]): Promise<number> => {
  try {
    const existingData = await AsyncStorage.getItem(QUESTIONS_KEY);
    const existingQuestions: LocalQuestion[] = existingData ? JSON.parse(existingData) : [];
    
    const questionsToSave: LocalQuestion[] = newQuestions.map(q => ({
      ...q,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: Date.now()
    }));
    
    // Taruh soal baru di paling depan
    const updatedQuestions = [...questionsToSave, ...existingQuestions];
    await AsyncStorage.setItem(QUESTIONS_KEY, JSON.stringify(updatedQuestions));
    return questionsToSave.length;
  } catch (error) {
    console.error("Error saving questions:", error);
    throw new Error("Gagal menyimpan soal ke memori HP.");
  }
};

export const saveSingleQuestionLocally = async (question: LocalQuestion): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(QUESTIONS_KEY);
    const existingQuestions: LocalQuestion[] = existingData ? JSON.parse(existingData) : [];
    const updatedQuestions = [question, ...existingQuestions];
    await AsyncStorage.setItem(QUESTIONS_KEY, JSON.stringify(updatedQuestions));
  } catch (error) {
    console.error("Error saving single question:", error);
  }
};

export const getLocalQuestions = async (): Promise<LocalQuestion[]> => {
  try {
    const data = await AsyncStorage.getItem(QUESTIONS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading questions:", error);
    return [];
  }
};

export const clearLocalQuestions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUESTIONS_KEY);
  } catch (error) {
    console.error("Error clearing questions:", error);
    throw error;
  }
};
