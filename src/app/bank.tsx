import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLocalQuestions, LocalQuestion, clearLocalQuestions, saveSingleQuestionLocally } from "../services/storage";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function BankSoal() {
  const router = useRouter();
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const data = await getLocalQuestions();
    setQuestions(data);
    setLoading(false);
  };

  const handleExport = async () => {
    if (questions.length === 0) {
      Alert.alert("Kosong", "Tidak ada soal untuk diekspor.");
      return;
    }
    
    try {
      const fileUri = FileSystem.documentDirectory + 'bank_soal_kuis.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(questions, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Ekspor Bank Soal',
          UTI: 'public.json'
        });
      } else {
        Alert.alert("Gagal", "Fitur berbagi tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengekspor data.");
    }
  };

  const handleMigrate = async () => {
    Alert.alert(
      "Konfirmasi Migrasi", 
      "Ini akan mengunduh semua soal dari Firebase Cloud ke HP Anda. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Migrasi", 
          onPress: async () => {
            setIsMigrating(true);
            try {
              const querySnapshot = await getDocs(collection(db, "questions"));
              let count = 0;
              for (const doc of querySnapshot.docs) {
                const data = doc.data();
                await saveSingleQuestionLocally({
                  id: doc.id,
                  question: data.question,
                  options: data.options,
                  correctAnswerIndex: data.correctAnswerIndex,
                  explanation: data.explanation,
                  createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
                });
                count++;
              }
              await loadQuestions();
              Alert.alert("Sukses", `Berhasil memigrasi ${count} soal ke memori lokal.`);
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Gagal memigrasi data dari Firebase.");
            } finally {
              setIsMigrating(false);
            }
          }
        }
      ]
    );
  };

  const handleClear = () => {
    Alert.alert(
      "Hapus Semua?", 
      "Semua soal di HP Anda akan dihapus permanen. Yakin?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            await clearLocalQuestions();
            await loadQuestions();
            Alert.alert("Dihapus", "Semua soal berhasil dihapus.");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Soal (Lokal)</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{questions.length}</Text>
          <Text style={styles.statLabel}>Total Soal</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4ECDC4' }]} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Ekspor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFD166' }]} onPress={handleMigrate} disabled={isMigrating}>
            {isMigrating ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="cloud-download-outline" size={18} color="#000" />}
            <Text style={[styles.actionBtnText, { color: '#000' }]}>Migrasi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Daftar Soal</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Kosongkan</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {questions.map((q, i) => (
            <View key={q.id || i} style={styles.questionItem}>
              <Text style={styles.qText} numberOfLines={2}>{q.question}</Text>
            </View>
          ))}
          {questions.length === 0 && (
            <Text style={styles.emptyText}>Belum ada soal di memori lokal.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1A1A2E' },
  backButton: { marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statsCard: { margin: 20, padding: 20, backgroundColor: '#1A1A2E', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#4ECDC4' },
  statLabel: { fontSize: 12, color: '#8F90A6', marginTop: 4 },
  actionsRow: { flexDirection: 'column', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, justifyContent: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  listTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  clearText: { color: '#FF6B6B', fontSize: 14 },
  scrollView: { paddingHorizontal: 20 },
  questionItem: { padding: 16, backgroundColor: '#1A1A2E', borderRadius: 12, marginBottom: 10 },
  qText: { color: '#E0E0E0', fontSize: 14, lineHeight: 20 },
  emptyText: { color: '#8F90A6', textAlign: 'center', marginTop: 40 }
});
