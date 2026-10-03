import { useState, useEffect } from "react";
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
  ScrollView,
  Modal,
  FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateQuestionsFromText, getAvailableModels, AIModel } from "../services/ai";
import { saveQuestionsLocally } from "../services/storage";

const MODEL_PREF_KEY = "@selected_ai_model";

export default function CreateQuiz() {
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      // Muat preferensi sebelumnya
      const savedModel = await AsyncStorage.getItem(MODEL_PREF_KEY);
      if (savedModel) {
        setSelectedModel(savedModel);
      }
      
      // Fetch model dari API
      const availableModels = await getAvailableModels();
      if (availableModels.length > 0) {
        setModels(availableModels);
      }
    } catch (e) {
      console.warn("Gagal memuat daftar model");
    }
  };

  const selectModel = async (modelName: string) => {
    setSelectedModel(modelName);
    setShowModelPicker(false);
    await AsyncStorage.setItem(MODEL_PREF_KEY, modelName);
  };

  const handleGenerate = async () => {
    if (material.trim().length < 10) {
      Alert.alert("Teks Terlalu Pendek", "Mohon masukkan materi yang cukup panjang (minimal 10 karakter) agar AI bisa membuat soal.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate dari AI dengan model pilihan
      const questions = await generateQuestionsFromText(material, selectedModel);
      
      if (!questions || questions.length === 0) {
        throw new Error("AI tidak mengembalikan soal.");
      }

      // 2. Simpan ke Local Storage (AsyncStorage/SAF)
      const successCount = await saveQuestionsLocally(questions);

      Alert.alert(
        "Sukses!", 
        `Berhasil membuat dan menyimpan ${successCount} soal kuis dari materi Anda.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error(error);
      Alert.alert("Terjadi Kesalahan", error.message || "Gagal membuat soal. Pastikan pengaturan sudah benar.");
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

        {/* Model Selector Button */}
        <TouchableOpacity 
          style={styles.modelSelector} 
          onPress={() => setShowModelPicker(true)}
          activeOpacity={0.7}
        >
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="hardware-chip-outline" size={20} color="#4ECDC4" style={{marginRight: 10}} />
            <View>
              <Text style={styles.modelSelectorLabel}>Model AI (Ketuk untuk ubah)</Text>
              <Text style={styles.modelSelectorValue}>{selectedModel}</Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8F90A6" />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Ketik atau paste materi pembelajaran di sini (minimal 10 karakter)..."
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
            AI ({selectedModel}) sedang berpikir merangkai soal...
          </Text>
        )}
      </ScrollView>

      {/* Model Picker Modal */}
      <Modal visible={showModelPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Model AI</Text>
            <Text style={styles.modalSubtitle}>Pilih model lain jika server sedang sibuk (Error 503/429).</Text>
            
            {models.length === 0 ? (
              <ActivityIndicator color="#4ECDC4" style={{marginVertical: 20}}/>
            ) : (
              <FlatList
                data={models}
                keyExtractor={(item) => item.name}
                style={{maxHeight: 300}}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[styles.modelOption, selectedModel === item.name && styles.modelOptionSelected]}
                    onPress={() => selectModel(item.name)}
                  >
                    <Text style={[styles.modelOptionText, selectedModel === item.name && {color: '#4ECDC4', fontWeight: 'bold'}]}>
                      {item.displayName}
                    </Text>
                    <Text style={styles.modelOptionSub}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowModelPicker(false)}>
              <Text style={styles.closeModalText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  modelSelector: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  modelSelectorLabel: {
    fontSize: 12,
    color: "#8F90A6",
    marginBottom: 4,
  },
  modelSelectorValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
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
    backgroundColor: "#4ECDC4",
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8F90A6',
    marginBottom: 20,
  },
  modelOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modelOptionSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  modelOptionText: {
    fontSize: 16,
    color: '#FFF',
  },
  modelOptionSub: {
    fontSize: 12,
    color: '#8F90A6',
    marginTop: 4,
  },
  closeModalBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
