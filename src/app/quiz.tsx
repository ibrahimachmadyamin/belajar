import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data sementara, nantinya akan diambil dari Firestore (kumpulan soal acak)
const MOCK_QUIZZES = [
  {
    id: '1',
    question: 'Berdasarkan materi yang dipelajari, apa manfaat utama kecerdasan buatan?',
    options: ['Mengurangi efisiensi', 'Menggantikan manusia sepenuhnya', 'Membantu proses otomatisasi & analisis', 'Menambah biaya produksi'],
    correctAnswerIndex: 2,
    explanation: 'AI sangat berguna untuk membantu otomatisasi tugas berulang dan melakukan analisis data dengan cepat.'
  },
  {
    id: '2',
    question: 'Manakah di bawah ini yang bukan merupakan bahasa pemrograman?',
    options: ['Python', 'HTML', 'Java', 'C++'],
    correctAnswerIndex: 1,
    explanation: 'HTML adalah bahasa markup untuk membuat kerangka web, bukan bahasa pemrograman berlogika.'
  }
];

export default function Quiz() {
  const router = useRouter();
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuiz = MOCK_QUIZZES[currentQuizIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuizIndex < MOCK_QUIZZES.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Kartu Pertanyaan */}
      <View style={styles.card}>
        <Text style={styles.progress}>Pertanyaan {currentQuizIndex + 1} dari {MOCK_QUIZZES.length}</Text>
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
              {currentQuizIndex < MOCK_QUIZZES.length - 1 ? 'Lanjut' : 'Selesai'}
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
