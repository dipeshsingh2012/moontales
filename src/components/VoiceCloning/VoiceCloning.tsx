/**
 * VoiceCloning Component
 *
 * Allows parents to select audio files from their device using expo-document-picker
 * to send to ElevenLabs for voice cloning.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';

interface VoiceCloningProps {
  onVoiceFileSelected: (fileUri: string, fileName: string) => void;
  currentVoiceId?: string;
  isCloning?: boolean;
}

export function VoiceCloning({ onVoiceFileSelected, currentVoiceId, isCloning }: VoiceCloningProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const isProcessing = loading || isCloning;

  const handlePickAudio = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      
      // Validate file size (ElevenLabs recommends 1-5 minutes, roughly 1-10MB)
      if (file.size && file.size > 25 * 1024 * 1024) { // 25MB limit
        Alert.alert(
          'File Too Large',
          'Audio file should be under 25MB. Please select a shorter recording.',
        );
        setLoading(false);
        return;
      }

      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];
      if (file.mimeType && !validTypes.includes(file.mimeType)) {
        Alert.alert(
          'Invalid File Type',
          'Please select an MP3, WAV, or M4A audio file.',
        );
        setLoading(false);
        return;
      }

      setSelectedFile(file.name);
      onVoiceFileSelected(file.uri, file.name);
      
      Alert.alert(
        'Audio Selected',
        `"${file.name}" has been selected for voice cloning. This will be used when generating new stories.`,
      );
    } catch (error) {
      console.error('Error picking audio file:', error);
      Alert.alert(
        'Error',
        'Failed to select audio file. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoice = () => {
    Alert.alert(
      'Remove Voice',
      'Are you sure you want to remove the current voice? New stories will use the default voice.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setSelectedFile(null);
            onVoiceFileSelected('', '');
          }
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Voice Cloning</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Upload a 1-5 minute recording of your voice to create a personalized narrator for stories.
      </Text>

      {selectedFile ? (
        <View style={styles.selectedFileContainer}>
          <View style={[styles.fileInfo, { backgroundColor: colors.background }]}>
            <Text style={[styles.fileName, { color: colors.text }]}>{selectedFile}</Text>
            <TouchableOpacity 
              onPress={handleDeleteVoice}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: colors.primary }]}
            onPress={handlePickAudio}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Change Voice</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={handlePickAudio}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.uploadIcon}>🎙️</Text>
              <Text style={styles.buttonText}>Select Audio File</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, { color: colors.textSecondary }]}>Tips for best results:</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Record in a quiet environment</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Speak naturally with varying pitch</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Use storytelling tone and pace</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Avoid background music or effects</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>• Duration: 1-5 minutes recommended</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  selectedFileContainer: {
    gap: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  changeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  uploadIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tipsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tip: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
});