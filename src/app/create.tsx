import { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateQuestionsFromText } from "../services/ai";
import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CreateQuiz() {
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (material.trim().length < 50) {
      Alert.alert("Teks Terlalu Pendek", "Mohon masukkan materi yang cukup panjang agar AI bisa membuat soal yang berkualitas.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate dari AI
      const questions = await generateQuestionsFromText(material);
      
      if (!questions || questions.length === 0) {
        throw new Error("AI tidak mengembalikan soal.");
      }

      // 2. Simpan ke Firebase
      const questionsRef = collection(db, "questions");
      let successCount = 0;
      
      // Kita simpan satu per satu agar mudah di-query secara acak nanti
      for (const q of questions) {
        await addDoc(questionsRef, {
          ...q,
          createdAt: serverTimestamp()
        });
        successCount++;
      }

      Alert.alert(
        "Sukses!", 
        `Berhasil membuat dan menyimpan ${successCount} soal kuis dari materi Anda.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error(error);
      Alert.alert("Terjadi Kesalahan", error.message || "Gagal membuat soal. Pastikan API Key dan Firebase sudah disetting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Materi Baru</Text>
          <Text style={styles.subtitle}>
            Paste artikel, catatan pelajaran, atau bacaan apa pun di sini. AI akan menganalisisnya dan membuatkan soal pilihan ganda.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Ketik atau paste materi pembelajaran di sini (minimal 50 karakter)..."
            placeholderTextColor="#5C5C70"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            value={material}
            onChangeText={setMaterial}
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (!material || loading) && styles.buttonDisabled]} 
          activeOpacity={0.8}
          onPress={handleGenerate}
          disabled={!material || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Generate Soal Kuis</Text>
            </>
          )}
        </TouchableOpacity>
        
        {loading && (
          <Text style={styles.loadingText}>
            AI sedang berpikir merangkai soal untuk Anda...
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8F90A6",
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
    minHeight: 250,
  },
  textArea: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#4ECDC4", // Mint green for create action
    flexDirection: "row",
    padding: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#2A2A3E",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#4ECDC4",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    fontStyle: "italic",
  }
});
