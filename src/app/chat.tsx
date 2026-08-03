import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiKey } from '../config/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Halo! Saya asisten belajar Anda. Ada materi yang ingin ditanyakan?', isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Tambahkan pesan user ke layar
    const newMessages = [
      ...messages,
      { id: Date.now().toString(), text: userMessage, isUser: true }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error("API Key belum diatur.");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      
      // Prompt untuk chatbot (idealnya kita pass konteks dari database Firestore di sini)
      const prompt = `Anda adalah asisten cerdas. Jawab pertanyaan berikut dengan ramah dan edukatif. Jika perlu, gunakan Google Search untuk melengkapi data.
      Pertanyaan user: ${userMessage}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: response, isUser: false }
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'Maaf, terjadi kesalahan: ' + error.message, isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.bubbleWrapper, msg.isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAI]}>
            <View style={[styles.bubble, msg.isUser ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={[styles.bubbleText, msg.isUser ? styles.textUser : styles.textAI]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.bubbleWrapper, styles.bubbleWrapperAI]}>
            <View style={[styles.bubble, styles.bubbleAI, { paddingHorizontal: 20 }]}>
              <ActivityIndicator color="#007AFF" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Tanya AI..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : "#999"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chatArea: {
    flex: 1,
  },
  bubbleWrapper: {
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperAI: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 24,
  },
  textUser: {
    color: '#fff',
  },
  textAI: {
    color: '#333',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E5EA',
  }
});
