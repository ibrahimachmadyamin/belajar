import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { saveApiKey, getApiKey, deleteApiKey } from '../config/storage';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    const key = await getApiKey();
    if (key) setApiKey(key);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'API Key tidak boleh kosong');
      return;
    }
    await saveApiKey(apiKey.trim());
    Alert.alert('Sukses', 'API Key berhasil disimpan!');
  };

  const handleClear = async () => {
    await deleteApiKey();
    setApiKey('');
    Alert.alert('Dihapus', 'API Key telah dihapus.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Google Gemini API Key</Text>
        <Text style={styles.description}>
          Aplikasi ini membutuhkan API Key Gemini (1.5 Pro / 2.5 Pro) agar fitur kecerdasan buatan dapat berjalan. Kunci ini hanya disimpan secara lokal di perangkat Anda.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Masukkan API Key (AIzaSy...)"
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Hapus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Kunci</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#FAFAFC',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#FF3B3015',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 16,
  },
});
