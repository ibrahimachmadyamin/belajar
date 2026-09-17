import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLocalQuestions, LocalQuestion, requestFolderPermission, getSavedFolderUri } from "../services/storage";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function BankSoal() {
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderUri, setFolderUri] = useState<string | null>(null);

  // Reload data every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const uri = await getSavedFolderUri();
    setFolderUri(uri);
    
    if (uri) {
      const data = await getLocalQuestions();
      setQuestions(data);
    }
    setLoading(false);
  };

  const handleSelectFolder = async () => {
    try {
      const uri = await requestFolderPermission();
      if (uri) {
        Alert.alert("Sukses", "Folder penyimpanan berhasil diatur.");
        loadData();
      } else {
        Alert.alert("Dibatalkan", "Akses ditolak atau Anda belum memilih folder penyimpanan.");
      }
    } catch (error: any) {
      Alert.alert("Error System", error.message || "Terjadi kesalahan sistem.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{questions.length}</Text>
          <Text style={styles.statLabel}>Total Soal</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4ECDC4' }]} onPress={handleSelectFolder}>
            <Ionicons name="folder-open" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Ubah Folder Database</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#8F90A6" />
        <Text style={styles.infoText}>
          {folderUri 
            ? "Aplikasi membaca semua file .json di folder Anda." 
            : "Silakan pilih folder (misal: Documents/Soal) sebagai database utama aplikasi ini."}
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Pratinjau Soal</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {!folderUri ? (
            <Text style={styles.emptyText}>Pilih folder database terlebih dahulu.</Text>
          ) : questions.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada file soal (.json) di dalam folder ini.</Text>
          ) : (
            questions.map((q, i) => (
              <View key={q.id || i} style={styles.questionItem}>
                <Text style={styles.qText} numberOfLines={2}>{q.question}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A", paddingTop: 20 },
  statsCard: { margin: 20, padding: 20, backgroundColor: '#1A1A2E', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#4ECDC4' },
  statLabel: { fontSize: 12, color: '#8F90A6', marginTop: 4 },
  actionsRow: { flexDirection: 'column', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, gap: 6, justifyContent: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  infoCard: { marginHorizontal: 20, marginBottom: 20, padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#8F90A6', fontSize: 12, flex: 1, lineHeight: 18 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  listTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollView: { paddingHorizontal: 20 },
  questionItem: { padding: 16, backgroundColor: '#1A1A2E', borderRadius: 12, marginBottom: 10 },
  qText: { color: '#E0E0E0', fontSize: 14, lineHeight: 20 },
  emptyText: { color: '#8F90A6', textAlign: 'center', marginTop: 40 }
});
