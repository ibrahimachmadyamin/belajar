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
import * as ImagePicker from "expo-image-picker";
import {
  generateWithFallback,
  extractTextFromImageWithFallback,
  getAvailableModels,
  getModelStatuses,
  pickBestModel,
  friendlyErrorMessage,
  REASON_LABEL,
  AIModel,
  ModelStatus,
} from "../services/ai";
import { saveQuestionsLocally } from "../services/storage";

const MODEL_PREF_KEY = "@selected_ai_model";

const STATUS_BADGE: Record<ModelStatus, { label: string; color: string }> = {
  ok: { label: "✅ Bisa dipakai gratis", color: "#4ECDC4" },
  paid: { label: "💰 Berbayar, tidak bisa dipakai", color: "#FF8A65" },
  quota: { label: "⏳ Jatah gratis hari ini habis", color: "#FFD166" },
  unavailable: { label: "🚫 Sudah tidak tersedia", color: "#FF6B6B" },
};

export default function CreateQuiz() {
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ModelStatus>>({});
  const [modelNotice, setModelNotice] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const router = useRouter();

  // Nama model yang mudah dibaca, misal "gemini-2.5-flash" -> "Gemini 2.5 Flash"
  const nameOf = (id: string) => models.find((m) => m.name === id)?.displayName || id;

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
      
      // Fetch model dari API + status gratis/berbayar yang tersimpan
      const [availableModels, savedStatuses] = await Promise.all([
        getAvailableModels(),
        getModelStatuses(),
      ]);
      setStatuses(savedStatuses);

      if (availableModels.length > 0) {
        setModels(availableModels);

        // Validasi: apakah model tersimpan masih ada & masih bisa dipakai?
        const current = savedModel || selectedModel;
        const stillExists = availableModels.some((m) => m.name === current);
        const s = savedStatuses[current];
        const unusable = s === "paid" || s === "unavailable";

        if (!stillExists || unusable) {
          const best = pickBestModel(availableModels, savedStatuses);
          if (best && best !== current) {
            setSelectedModel(best);
            await AsyncStorage.setItem(MODEL_PREF_KEY, best);
            const bestName = availableModels.find((m) => m.name === best)?.displayName || best;
            setModelNotice(
              !stillExists
                ? `Model AI yang Anda pakai sebelumnya sudah tidak ada lagi, jadi otomatis diganti ke ${bestName}.`
                : `Model AI yang Anda pakai sebelumnya ternyata berbayar, jadi otomatis diganti ke ${bestName}.`
            );
          }
        }
      }
    } catch (e) {
      console.warn("Gagal memuat daftar model");
    }
  };

  const selectModel = async (modelName: string) => {
    setSelectedModel(modelName);
    setShowModelPicker(false);
    setModelNotice(null);
    await AsyncStorage.setItem(MODEL_PREF_KEY, modelName);
  };

  const handleGenerate = async () => {
    if (material.trim().length < 10) {
      Alert.alert("Teks Terlalu Pendek", "Mohon masukkan materi yang cukup panjang (minimal 10 karakter) agar AI bisa membuat soal.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate dari AI dengan model pilihan (otomatis pindah model jika gagal)
      const { questions, modelUsed, skipped } = await generateWithFallback(
        material,
        selectedModel,
        models,
        setActiveModel
      );
      
      if (!questions || questions.length === 0) {
        throw new Error("AI tidak mengembalikan soal.");
      }

      // 2. Simpan ke Local Storage (AsyncStorage/SAF)
      const successCount = await saveQuestionsLocally(questions);

      // Jika model pilihan bermasalah permanen, jadikan model yang berhasil sebagai pilihan baru
      const firstSkip = skipped.find((s) => s.name === selectedModel);
      const switchedInfo = firstSkip
        ? `\n\nCatatan: ${firstSkip.displayName} sedang tidak bisa dipakai (${REASON_LABEL[firstSkip.reason]}), jadi soal otomatis dibuat memakai ${nameOf(modelUsed)}.`
        : "";
      if (modelUsed !== selectedModel) {
        const reason = firstSkip?.reason;
        if (reason === "paid" || reason === "unavailable") {
          setSelectedModel(modelUsed);
          await AsyncStorage.setItem(MODEL_PREF_KEY, modelUsed);
        }
      }
      setStatuses(await getModelStatuses());

      Alert.alert(
        "Berhasil! 🎉", 
        `${successCount} soal baru sudah dibuat dan disimpan.${switchedInfo}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error(error);
      setStatuses(await getModelStatuses());
      // Tampilkan penjelasan sederhana; detail teknis tetap bisa dilihat jika perlu
      Alert.alert(
        "Gagal Membuat Soal",
        friendlyErrorMessage(error),
        [
          { text: "Lihat detail", onPress: () => Alert.alert("Detail teknis", String(error?.message || error)) },
          { text: "OK", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
      setActiveModel(null);
    }
  };

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Izin Kamera Diperlukan",
            "Aplikasi membutuhkan izin kamera untuk memfoto catatan atau buku pelajaran."
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Izin Galeri Diperlukan",
            "Aplikasi membutuhkan izin galeri untuk memilih foto materi."
          );
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.8,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.8,
            allowsEditing: false,
          });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Gagal", "File gambar tidak dapat dibaca.");
        return;
      }

      const mimeType = asset.mimeType || "image/jpeg";
      setOcrLoading(true);
      setActiveModel(selectedModel);

      const { text, modelUsed, skipped } = await extractTextFromImageWithFallback(
        asset.base64,
        mimeType,
        selectedModel,
        models,
        setActiveModel
      );

      if (!text || text.trim().length === 0) {
        Alert.alert(
          "Tidak Ada Teks Terbaca",
          "AI tidak menemukan teks atau rumus pada gambar tersebut. Pastikan gambar cukup jelas dan tidak buram."
        );
        return;
      }

      if (material.trim().length > 0) {
        Alert.alert(
          "Teks Berhasil Dibaca! ✨",
          "Teks dan rumus dari gambar telah diekstrak. Mau diapakan terhadap materi yang sudah ada di kotak?",
          [
            {
              text: "Tambahkan di Bawah",
              onPress: () => setMaterial((prev) => `${prev}\n\n${text}`),
            },
            {
              text: "Ganti Semua",
              onPress: () => setMaterial(text),
            },
            { text: "Batal", style: "cancel" },
          ]
        );
      } else {
        setMaterial(text);
        Alert.alert(
          "Teks Berhasil Dibaca! ✨",
          "Teks dan rumus telah disalin ke kotak materi. Silakan periksa atau ubah jika diperlukan sebelum membuat soal kuis."
        );
      }

      const firstSkip = skipped.find((s) => s.name === selectedModel);
      if (modelUsed !== selectedModel && (firstSkip?.reason === "paid" || firstSkip?.reason === "unavailable")) {
        setSelectedModel(modelUsed);
        await AsyncStorage.setItem(MODEL_PREF_KEY, modelUsed);
      }
      setStatuses(await getModelStatuses());
    } catch (error: any) {
      console.error("Gagal membaca gambar:", error);
      setStatuses(await getModelStatuses());
      Alert.alert(
        "Gagal Membaca Gambar",
        friendlyErrorMessage(error),
        [
          { text: "Lihat detail", onPress: () => Alert.alert("Detail teknis", String(error?.message || error)) },
          { text: "OK", style: "cancel" },
        ]
      );
    } finally {
      setOcrLoading(false);
      setActiveModel(null);
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
              <Text style={styles.modelSelectorLabel}>Model AI (ketuk untuk ganti)</Text>
              <Text style={styles.modelSelectorValue}>{nameOf(selectedModel)}</Text>
              {statuses[selectedModel] && statuses[selectedModel] !== "ok" && (
                <Text style={[styles.modelBadge, { color: STATUS_BADGE[statuses[selectedModel]].color }]}>
                  {STATUS_BADGE[statuses[selectedModel]].label}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8F90A6" />
        </TouchableOpacity>

        {modelNotice && (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#FFD166" style={{marginRight: 8}} />
            <Text style={styles.noticeText}>{modelNotice}</Text>
          </View>
        )}

        {/* Tombol Input Gambar / Foto */}
        <View style={styles.imageActionBar}>
          <TouchableOpacity 
            style={[styles.imageBtn, (loading || ocrLoading) && styles.imageBtnDisabled]}
            onPress={() => handlePickImage(true)}
            disabled={loading || ocrLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={18} color="#4ECDC4" style={{marginRight: 6}} />
            <Text style={styles.imageBtnText}>Foto Catatan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.imageBtn, (loading || ocrLoading) && styles.imageBtnDisabled]}
            onPress={() => handlePickImage(false)}
            disabled={loading || ocrLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={18} color="#4ECDC4" style={{marginRight: 6}} />
            <Text style={styles.imageBtnText}>Pilih Gambar</Text>
          </TouchableOpacity>
        </View>

        {ocrLoading && (
          <View style={styles.ocrLoadingBox}>
            <ActivityIndicator color="#4ECDC4" size="small" style={{marginRight: 8}} />
            <Text style={styles.ocrLoadingText}>
              {nameOf(activeModel || selectedModel)} sedang membaca teks & rumus...
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Ketik, paste, atau foto materi pembelajaran di sini (minimal 10 karakter)..."
            placeholderTextColor="#5C5C70"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            value={material}
            onChangeText={setMaterial}
            editable={!loading && !ocrLoading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (!material || loading || ocrLoading) && styles.buttonDisabled]} 
          activeOpacity={0.8}
          onPress={handleGenerate}
          disabled={!material || loading || ocrLoading}
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
            {nameOf(activeModel || selectedModel)} sedang membuat soal...
          </Text>
        )}
      </ScrollView>

      {/* Model Picker Modal */}
      <Modal visible={showModelPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Model AI</Text>
            <Text style={styles.modalSubtitle}>Model paling atas biasanya yang terbaru. Kalau satu model sedang penuh atau habis, aplikasi akan otomatis mencoba model lain.</Text>
            
            {models.length === 0 ? (
              <ActivityIndicator color="#4ECDC4" style={{marginVertical: 20}}/>
            ) : (
              <FlatList
                data={models}
                keyExtractor={(item) => item.name}
                style={{maxHeight: 300}}
                renderItem={({item}) => {
                  const badge = statuses[item.name] ? STATUS_BADGE[statuses[item.name]] : null;
                  return (
                  <TouchableOpacity 
                    style={[styles.modelOption, selectedModel === item.name && styles.modelOptionSelected]}
                    onPress={() => selectModel(item.name)}
                  >
                    <Text style={[styles.modelOptionText, selectedModel === item.name && {color: '#4ECDC4', fontWeight: 'bold'}]}>
                      {item.displayName}
                    </Text>
                    <Text style={styles.modelOptionSub}>{item.name}</Text>
                    <Text style={[styles.modelBadge, { color: badge?.color || '#5C5C70' }]}>
                      {badge?.label || "❔ Belum dicoba"}
                    </Text>
                  </TouchableOpacity>
                  );
                }}
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
  modelBadge: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  noticeText: {
    flex: 1,
    color: '#FFD166',
    fontSize: 13,
    lineHeight: 19,
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
  },
  imageActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  imageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  imageBtnDisabled: {
    opacity: 0.5,
  },
  imageBtnText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  ocrLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  ocrLoadingText: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '500',
  },
});
