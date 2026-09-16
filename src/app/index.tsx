import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="infinite" size={60} color="#FF6B6B" />
        </View>
        <Text style={styles.title}>Quiz<Text style={styles.titleHighlight}>Chain</Text></Text>
        <Text style={styles.subtitle}>
          Belajar tanpa batas. Generate kuis dari materimu secara lokal.
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryCard} activeOpacity={0.8} onPress={() => router.push("/quiz")}>
          <View style={styles.cardIcon}>
            <Ionicons name="play" size={32} color="#FFF" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Mulai Kuis</Text>
            <Text style={styles.cardSubtitle}>Mainkan soal secara offline</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryCard, { borderColor: '#4ECDC4' }]} activeOpacity={0.8} onPress={() => router.push("/create")}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
            <Ionicons name="add-circle" size={32} color="#4ECDC4" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Buat Soal Baru</Text>
            <Text style={[styles.cardSubtitle, { color: '#8F90A6' }]}>Generate dengan AI</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryCard, { borderColor: '#FFD166' }]} activeOpacity={0.8} onPress={() => router.push("/bank")}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(255, 209, 102, 0.2)' }]}>
            <Ionicons name="library" size={32} color="#FFD166" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Bank Soal</Text>
            <Text style={[styles.cardSubtitle, { color: '#8F90A6' }]}>Kelola & Ekspor Soal Lokal</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A", // Premium dark background
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 50,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  titleHighlight: {
    color: "#FF6B6B", // Coral pink highlight
  },
  subtitle: {
    fontSize: 16,
    color: "#8F90A6",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 24,
  },
  actionContainer: {
    padding: 24,
    paddingBottom: 50,
    gap: 20,
  },
  primaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B", // Coral primary
    padding: 20,
    borderRadius: 24,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E", // Dark card
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
