import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, collection, getDocs, query } from '../config/firebase';

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic?: string;
}

export default function Quiz() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'quizzes'));
      const snapshot = await getDocs(q);
      const data: QuizItem[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as QuizItem);
      });
      
      if (data.length > 0) {
        // Acak kuis
        data.sort(() => Math.random() - 0.5);
        setQuizzes(data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat kuis dari database.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuiz = quizzes[currentQuizIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>Memuat kuis dari database...</Text>
      </View>
    );
  }

  if (quizzes.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={{ marginTop: 16, color: '#666', textAlign: 'center' }}>Belum ada kuis. Masukkan materi terlebih dahulu di halaman utama.</Text>
        <TouchableOpacity style={{ marginTop: 24, padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kartu Pertanyaan */}
      <View style={styles.card}>
        <Text style={styles.progress}>Pertanyaan {currentQuizIndex + 1} dari {quizzes.length}</Text>
        <Text style={styles.question}>{currentQuiz.question}</Text>
        
        <ScrollView style={styles.optionsContainer}>
          {currentQuiz.options.map((option, index) => {
            let optionStyle = styles.optionButton;
            let textStyle = styles.optionText;

            if (isAnswered) {
              if (index === currentQuiz.correctAnswerIndex) {
                optionStyle = [styles.optionButton, styles.optionCorrect];
                textStyle = [styles.optionText, styles.textCorrect];
              } else if (index === selectedOption) {
                optionStyle = [styles.optionButton, styles.optionWrong];
                textStyle = [styles.optionText, styles.textWrong];
              }
            } else if (index === selectedOption) {
              optionStyle = [styles.optionButton, styles.optionSelected];
            }

            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleSelectOption(index)}
                activeOpacity={0.7}
              >
                <Text style={textStyle}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Penjelasan jika sudah menjawab */}
        {isAnswered && (
          <View style={styles.explanationBox}>
            <View style={styles.explanationHeader}>
              <Ionicons 
                name={selectedOption === currentQuiz.correctAnswerIndex ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={selectedOption === currentQuiz.correctAnswerIndex ? '#34C759' : '#FF3B30'} 
              />
              <Text style={styles.explanationTitle}>Penjelasan</Text>
            </View>
            <Text style={styles.explanationText}>{currentQuiz.explanation}</Text>
          </View>
        )}
      </View>

      {/* Tombol Bawah */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
          <Text style={styles.exitButtonText}>Keluar</Text>
        </TouchableOpacity>
        
        {isAnswered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQuizIndex < quizzes.length - 1 ? 'Lanjut' : 'Selesai'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    flex: 1,
    marginBottom: 20,
  },
  progress: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF0A',
  },
  optionCorrect: {
    borderColor: '#34C759',
    backgroundColor: '#34C75910',
  },
  optionWrong: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3010',
  },
  optionText: {
    fontSize: 16,
    color: '#444',
  },
  textCorrect: {
    color: '#248A3D',
    fontWeight: '600',
  },
  textWrong: {
    color: '#C92A20',
    fontWeight: '600',
  },
  explanationBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  explanationText: {
    color: '#555',
    lineHeight: 22,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  exitButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flex: 1,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
