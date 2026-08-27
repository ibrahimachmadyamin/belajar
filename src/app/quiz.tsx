import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../config/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export default function Quiz() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Untuk prototipe, kita ambil 50 soal terakhir (idealnya pakai random/algoritma lain)
      const q = query(
        collection(db, "questions"), 
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const loadedQuestions: Question[] = [];
      querySnapshot.forEach((doc) => {
        loadedQuestions.push({ id: doc.id, ...doc.data() } as Question);
      });
      
      // Acak urutan soal
      const shuffled = loadedQuestions.sort(() => 0.5 - Math.random());
      setQuestions(shuffled);
    } catch (error) {
      console.error("Gagal mengambil soal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // Mencegah klik ganda setelah memilih
    setSelectedOption(index);
  };

  const handleNext = () => {
    setSelectedOption(null);
    
    // Jika soal hampir habis, di aplikasi nyata kita akan fetch lagi
    // Untuk prototipe ini, kita putar balik kalau habis
    if (currentIndex >= questions.length - 1) {
      setCurrentIndex(0);
      fetchQuestions(); // Ambil soal baru (acak ulang)
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Menyiapkan rantai kuis...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centerAll, { padding: 20 }]}>
        <Ionicons name="folder-open-outline" size={60} color="#8F90A6" />
        <Text style={styles.emptyText}>Belum ada soal kuis.</Text>
        <Text style={styles.emptySubText}>Silakan kembali ke Beranda dan buat soal dari materi terlebih dahulu.</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Progress & Header */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Ionicons name="infinite" size={16} color="#FF6B6B" style={{marginRight: 4}}/>
            <Text style={styles.badgeText}>Endless Mode</Text>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let buttonStyle = styles.optionButton;
            let textStyle = styles.optionText;
            let icon = null;

            if (isAnswered) {
              if (index === currentQuestion.correctAnswerIndex) {
                // Jawaban yang benar selalu disorot hijau setelah dijawab
                buttonStyle = styles.optionButtonCorrect;
                textStyle = styles.optionTextCorrect;
                icon = <Ionicons name="checkmark-circle" size={24} color="#FFF" />;
              } else if (index === selectedOption) {
                // Jawaban yang dipilih pengguna tapi salah
                buttonStyle = styles.optionButtonWrong;
                textStyle = styles.optionTextWrong;
                icon = <Ionicons name="close-circle" size={24} color="#FFF" />;
              } else {
                // Opsi lainnya yang tidak dipilih diredupkan
                buttonStyle = styles.optionButtonDisabled;
                textStyle = styles.optionTextDisabled;
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[buttonStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                activeOpacity={0.7}
                onPress={() => handleOptionSelect(index)}
                disabled={isAnswered}
              >
                <Text style={[textStyle, { flex: 1, paddingRight: 10 }]}>{option}</Text>
                {icon}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation & Next Button */}
        {isAnswered && (
          <View style={styles.feedbackContainer}>
            <View style={[styles.explanationCard, { borderColor: isCorrect ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 107, 107, 0.3)' }]}>
              <Text style={[styles.feedbackTitle, { color: isCorrect ? "#4ECDC4" : "#FF6B6B" }]}>
                {isCorrect ? "Jawaban Anda Benar! 🎉" : "Kurang Tepat 🤔"}
              </Text>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.nextButton} activeOpacity={0.8} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Lanjut ke Soal Berikutnya</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  centerAll: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8F90A6",
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    color: "#8F90A6",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  badgeText: {
    color: "#FF6B6B",
    fontWeight: "bold",
    fontSize: 12,
  },
  questionCard: {
    backgroundColor: "#1A1A2E",
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#2A2A3E",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  optionButtonCorrect: {
    backgroundColor: "#4ECDC4", // Green
    padding: 18,
    borderRadius: 16,
  },
  optionTextCorrect: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionButtonWrong: {
    backgroundColor: "#FF6B6B", // Red
    padding: 18,
    borderRadius: 16,
  },
  optionTextWrong: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionButtonDisabled: {
    backgroundColor: "#1A1A2E",
    padding: 18,
    borderRadius: 16,
    opacity: 0.5,
  },
  optionTextDisabled: {
    color: "#8F90A6",
    fontSize: 16,
  },
  feedbackContainer: {
    marginTop: 32,
    animation: "fadeIn 0.5s", // pseudo representation, rn handles it statically unless reanimated is used
  },
  explanationCard: {
    backgroundColor: "#1A1A2E",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  explanationText: {
    color: "#E0E0E0",
    fontSize: 15,
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    padding: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    gap: 8,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  }
});
