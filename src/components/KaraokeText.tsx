import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlignmentData } from '../types';

interface KaraokeTextProps {
  text: string;
  alignment?: AlignmentData | null;
  currentTimeMs: number;
}

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  alignment,
  currentTimeMs,
}) => {
  const words = React.useMemo(() => {
    if (
      !alignment ||
      !alignment.characters ||
      alignment.characters.length === 0 ||
      alignment.character_start_times_ms.length !== alignment.characters.length
    ) {
      return null;
    }

    const { characters, character_start_times_ms, character_end_times_ms } = alignment;
    const result: { word: string; startMs: number; endMs: number }[] = [];
    let currentWord = '';
    let startMs = -1;
    let endMs = 0;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const s = character_start_times_ms[i] ?? 0;
      const e = character_end_times_ms[i] ?? s;

      if (/\s/.test(char)) {
        if (currentWord) {
          result.push({ word: currentWord + char, startMs, endMs });
          currentWord = '';
          startMs = -1;
        } else if (result.length > 0) {
          result[result.length - 1].word += char;
        }
      } else {
        if (startMs === -1) {
          startMs = s;
        }
        endMs = e;
        currentWord += char;
      }
    }

    if (currentWord) {
      result.push({ word: currentWord, startMs, endMs });
    }

    return result;
  }, [alignment]);

  if (!words || words.length === 0) {
    return <Text style={styles.plainText}>{text}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.textContainer}>
        {words.map((w, index) => {
          const isCurrent = currentTimeMs >= w.startMs && currentTimeMs < w.endMs;
          const isSpoken = currentTimeMs >= w.endMs && currentTimeMs > 0;

          let wordStyle = styles.upcomingText;
          if (isCurrent) {
            wordStyle = styles.currentText;
          } else if (isSpoken) {
            wordStyle = styles.spokenText;
          }

          return (
            <Text key={index} style={wordStyle}>
              {w.word}
            </Text>
          );
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  textContainer: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  plainText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    color: '#EDE8F5',
  },
  spokenText: {
    color: '#FFD166',
    fontWeight: '600',
  },
  currentText: {
    color: '#FFE29A',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 209, 102, 0.25)',
  },
  upcomingText: {
    color: '#C3B9D9',
    fontWeight: '400',
  },
});
