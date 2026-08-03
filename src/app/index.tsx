import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { processMaterial, generateQuiz } from '../services/ai';
// import { db, collection, addDoc } from '../config/firebase'; 
// TODO: Uncomment when firebase is properly configured by user

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    try {
      // 1. Kirim ke AI untuk merapikan materi
      const processed = await processMaterial(text);
      
      // 2. Kirim ke AI untuk membuat soal kuis berdasarkan materi
      const quizData = await generateQuiz(processed.content);
      
      // 3. Simpan ke Database
      /*
      await addDoc(collection(db, 'materials'), processed);
      for (const q of quizData) {
        await addDoc(collection(db, 'quizzes'), { ...q, topic: processed.topic });
      }
      */
      
      console.log('Materi berhasil diproses:', processed);
      console.log('Kuis berhasil dibuat:', quizData);
      
      setText('');
      Alert.alert('Sukses', 'Materi berhasil dipelajari dan disimpan oleh AI!');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal memproses materi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navButton, styles.navButtonMain]} onPress={() => router.push('/quiz')}>
          <Ionicons name="school-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Quiz</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/chat')}>
          <Ionicons name="chatbubbles-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Tuliskan atau tempel materi yang ingin dipelajari di sini..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={28} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sendButton, (!text.trim() || isLoading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  navButtonMain: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});
