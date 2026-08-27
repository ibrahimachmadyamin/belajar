import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // Need to check if installed, if not we will just use flat colors for now.
// Actually, let's use flat premium colors to be safe since expo-linear-gradient might not be installed in the package.json.
// Wait, looking at package.json, expo-linear-gradient is NOT installed. I will use standard StyleSheet with nice shadows and colors.

const { width } = Dimensions.get("window");

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="infinite" size={60} color="#FF6B6B" />
        </View>
        <Text style={styles.title}>Quiz<Text style={styles.titleHighlight}>Chain</Text></Text>
        <Text style={styles.subtitle}>
          Belajar tanpa batas. Generate kuis pilihan ganda dari materimu sendiri menggunakan kekuatan AI.
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <Link href="/quiz" asChild>
          <TouchableOpacity style={styles.primaryCard} activeOpacity={0.8}>
            <View style={styles.cardIcon}>
              <Ionicons name="play" size={32} color="#FFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Mulai Kuis</Text>
              <Text style={styles.cardSubtitle}>Jawab rantai soal tanpa henti</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </Link>

        <Link href="/create" asChild>
          <TouchableOpacity style={styles.secondaryCard} activeOpacity={0.8}>
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
              <Ionicons name="add-circle" size={32} color="#4ECDC4" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Buat Soal Baru</Text>
              <Text style={styles.cardSubtitle}>Generate dari teks materi AI</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </Link>
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
