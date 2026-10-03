import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions, Image,
} from 'react-native';
import { AudioService } from '../../services/audio';
import { Story, StoryPage } from '../../types';
import { useTheme } from '../../context/ThemeContext';

const { width: W } = Dimensions.get('window');
const STAGE_W = W - 24;

const THEME_STYLES: Record<string, { bg: string; icons: string }> = {
  fantasy:       { bg: '#7b2fbe', icons: '🧙✨🌟' },
  adventure:     { bg: '#e65100', icons: '🗺️⚔️🏔️' },
  animals:       { bg: '#2e7d32', icons: '🐾🦊🌿' },
  space:         { bg: '#1565c0', icons: '🚀🌟🪐' },
  ocean:         { bg: '#00838f', icons: '🌊🐚🐠' },
  dinosaurs:     { bg: '#6d4c41', icons: '🦕🌋🦖' },
  superheroes:   { bg: '#c62828', icons: '🦸⚡🛡️' },
  'fairy tales': { bg: '#ad1457', icons: '🏰👑🧚' },
  bedtime:       { bg: '#4527a0', icons: '🌙⭐💤' },
};
function getTheme(t: string) {
  const k = Object.keys(THEME_STYLES).find((k) => t?.toLowerCase().includes(k));
  return k ? THEME_STYLES[k] : { bg: '#4527a0', icons: '📖✨🌙' };
}

// ── Karaoke text ──────────────────────────────────────────────────────────────

interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

function KaraokeText({
  page,
  positionMs,
}: {
  page: StoryPage;
  positionMs: number;
}) {
  const { alignment, text } = page;

  const words = useMemo(() => {
    if (
      !alignment ||
      !alignment.characters ||
      !alignment.characters.length ||
      !alignment.character_start_times_ms ||
      !alignment.character_start_times_ms.length
    ) {
      return null;
    }

    const { characters, character_start_times_ms, character_end_times_ms } = alignment;
    const result: WordTiming[] = [];
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
    return <Text style={styles.pageText}>{text}</Text>;
  }

  return (
    <Text style={styles.pageText}>
      {words.map((w, idx) => {
        const isCurrent = positionMs >= w.startMs && positionMs < w.endMs;
        const isSpoken = positionMs >= w.endMs && positionMs > 0;

        return (
          <Text
            key={idx}
            style={
              isCurrent
                ? styles.wordHighlightCurrent
                : isSpoken
                ? styles.wordHighlightSpoken
                : styles.wordUpcoming
            }
          >
            {w.word}
          </Text>
        );
      })}
    </Text>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

function PageContent({
  page,
  pageNum,
  total,
  positionMs,
}: {
  page: StoryPage;
  pageNum: number;
  total: number;
  positionMs: number;
}) {
  const imageUri = page.local_image_path || page.image_url || page.imageUrl;
  const { bg, icons } = getTheme(page.image_prompt ?? '');
  return (
    <View style={styles.pagePaper}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.illus} resizeMode="cover" />
      ) : (
        <View style={[styles.illus, { backgroundColor: bg }]}>
          <Text style={styles.illusIcons}>{icons}</Text>
        </View>
      )}
      <View style={styles.textArea}>
        <KaraokeText page={page} positionMs={positionMs} />
      </View>
      <View style={styles.pageFooter}>
        <View style={styles.rule} />
        <Text style={styles.pageNum}>{pageNum} / {total}</Text>
        <View style={styles.rule} />
      </View>
      <View style={styles.bindingLeft}  pointerEvents="none" />
      <View style={styles.bindingRight} pointerEvents="none" />
    </View>
  );
}

// ── The End card ──────────────────────────────────────────────────────────────

function TheEndContent({
  story, onNewStory, onClose,
}: {
  story: Story; onNewStory?: () => void; onClose?: () => void;
}) {
  const { bg } = getTheme(story.title ?? '');
  return (
    <View style={styles.pagePaper}>
      <View style={[styles.illus, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 56 }}>🌙</Text>
        <Text style={styles.theEndH}>The End</Text>
      </View>
      <View style={[styles.textArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.theEndTitle}>{story.title}</Text>
        <View style={styles.savedBadge}>
          <Text style={styles.savedBadgeText}>✅ Saved to Library</Text>
        </View>
        <TouchableOpacity style={styles.newStoryBtn} onPress={onNewStory}>
          <Text style={styles.newStoryBtnText}>✨ New Story</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ paddingVertical: 10 }}>
          <Text style={styles.homeLink}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bindingLeft} pointerEvents="none" />
    </View>
  );
}

// ── Dots ──────────────────────────────────────────────────────────────────────

function Dots({ total, current, colors }: { total: number; current: number; colors: any }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? colors.primary : colors.border,
              width: i === current ? 18 : 7,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Audio controls ────────────────────────────────────────────────────────────

function AudioBar({
  page,
  colors,
  autoPlay = true,
  onPositionMs,
  onPageComplete,
}: {
  page: StoryPage;
  colors: any;
  autoPlay?: boolean;
  onPositionMs: (ms: number) => void;
  onPageComplete?: () => void;
}) {
  const audioServiceRef = useRef<AudioService | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageCompletedRef = useRef(false);

  const audioPath = page.local_audio_path || page.audio_url;

  useEffect(() => {
    let isMounted = true;
    pageCompletedRef.current = false;

    const service = new AudioService();
    audioServiceRef.current = service;

    const unsubscribe = service.subscribe((state) => {
      if (!isMounted) return;
      setPlaying(state.isPlaying);
      onPositionMs(state.position);

      // Check if audio finished (prevent duplicate triggers)
      if (state.duration > 0 && state.position >= state.duration - 200 && !pageCompletedRef.current) {
        pageCompletedRef.current = true;
        onPageComplete?.();
      }
    });

    if (audioPath) {
      setLoading(true);
      service.loadAudio(audioPath)
        .then(() => {
          if (!isMounted) return;
          if (autoPlay) {
            return service.play();
          }
        })
        .catch((e) => {
          if (isMounted) console.warn('[AudioBar] Auto-play/load failed:', e);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
      unsubscribe();
      service.cleanup();
    };
  }, [audioPath, autoPlay]);

  const toggle = async () => {
    if (!audioPath || !audioServiceRef.current) return;

    const state = audioServiceRef.current.getState();

    if (state.isPlaying) {
      await audioServiceRef.current.pause();
    } else if (state.isLoaded) {
      await audioServiceRef.current.play();
    } else {
      setLoading(true);
      try {
        await audioServiceRef.current.loadAudio(audioPath);
        await audioServiceRef.current.play();
      } catch (e) {
        console.warn('Audio load failed:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const audioAvailable = !!audioPath;

  return (
    <TouchableOpacity
      style={[styles.audioBtn, { backgroundColor: audioAvailable ? colors.primary : colors.card }]}
      onPress={toggle}
      disabled={!audioAvailable || loading}
      activeOpacity={0.8}
    >
      <Text style={styles.audioBtnText}>
        {!audioAvailable ? '🔇' : loading ? '⏳' : playing ? '⏸' : '▶️'}
      </Text>
    </TouchableOpacity>
  );
}


// ── Main StoryBook ────────────────────────────────────────────────────────────

export interface StoryBookProps {
  story: Story;
  onClose?: () => void;
  onNewStory?: () => void;
  onLastPage?: () => void;
}

export function StoryBook({ story, onClose, onNewStory, onLastPage }: StoryBookProps) {
  const { colors } = useTheme();

  const pages = story.pages ?? [];
  const totalPages  = pages.length;
  const totalSlides = totalPages + 1;

  const [currentPage, setCurrentPage]  = useState(0);
  const [positionMs,   setPositionMs]   = useState(0);
  const [autoAdvance, setAutoAdvance]   = useState(true);
  const currentPageRef   = useRef(0);
  const isOnLastPageRef  = useRef(false);
  const isAnim           = useRef(false);

  const stripX     = useRef(new Animated.Value(0)).current;
  const baseX      = useRef(0);
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const hasSaved = useRef(false);

  useEffect(() => {
    isOnLastPageRef.current = currentPage === totalSlides - 1;
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === totalSlides - 1 && !hasSaved.current) {
      hasSaved.current = true;
      onLastPage?.();
    }
    // Reset karaoke position on page change
    setPositionMs(0);
  }, [currentPage]);

  const goToPage = (idx: number) => {
    if (idx < 0 || idx >= totalSlides || isAnim.current) return;
    isAnim.current = true;
    const targetX = -(idx * STAGE_W);
    Animated.sequence([
      Animated.timing(shadowAnim, { toValue: 0.35, duration: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(stripX, { toValue: targetX, useNativeDriver: true, bounciness: 0, speed: 26 }),
        Animated.timing(shadowAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
    ]).start(() => {
      baseX.current = targetX;
      currentPageRef.current = idx;
      setCurrentPage(idx);
      isAnim.current = false;
    });
  };

  const handlePageComplete = useCallback(() => {
    if (autoAdvance && currentPage < totalPages - 1) {
      // Add a small delay before advancing
      setTimeout(() => {
        goToPage(currentPage + 1);
      }, 500);
    }
  }, [autoAdvance, currentPage, totalPages]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !isOnLastPageRef.current,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
    onPanResponderGrant: () => {
      stripX.stopAnimation();
      baseX.current = -(currentPageRef.current * STAGE_W);
      stripX.setValue(baseX.current);
    },
    onPanResponderMove: (_, g) => {
      const raw = baseX.current + g.dx;
      const min = -((totalSlides - 1) * STAGE_W);
      stripX.setValue(Math.max(min - STAGE_W * 0.12, Math.min(STAGE_W * 0.12, raw)));
      shadowAnim.setValue(Math.min(0.38, Math.abs(g.dx) / STAGE_W * 0.7));
    },
    onPanResponderRelease: (e, g) => {
      const { dx, dy } = g;
      const isTap = Math.abs(dx) < 6 && Math.abs(dy) < 6;
      Animated.timing(shadowAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start();
      if (isTap) {
        const tapX = e.nativeEvent.locationX;
        goToPage(tapX < STAGE_W / 2 ? currentPageRef.current - 1 : currentPageRef.current + 1);
        return;
      }
      const THRESHOLD = STAGE_W * 0.22;
      const cur = currentPageRef.current;
      if (dx < -THRESHOLD) {
        const next = cur + 1;
        if (next >= totalSlides) { snapBack(cur); return; }
        isAnim.current = true;
        Animated.spring(stripX, { toValue: -(next * STAGE_W), useNativeDriver: true, bounciness: 0, speed: 26 })
          .start(() => { baseX.current = -(next * STAGE_W); currentPageRef.current = next; setCurrentPage(next); isAnim.current = false; });
      } else if (dx > THRESHOLD) {
        const prev = cur - 1;
        if (prev < 0) { snapBack(cur); return; }
        isAnim.current = true;
        Animated.spring(stripX, { toValue: -(prev * STAGE_W), useNativeDriver: true, bounciness: 0, speed: 26 })
          .start(() => { baseX.current = -(prev * STAGE_W); currentPageRef.current = prev; setCurrentPage(prev); isAnim.current = false; });
      } else {
        snapBack(cur);
      }
    },
    onPanResponderTerminate: () => {
      snapBack(currentPageRef.current);
      Animated.timing(shadowAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    },
  })).current;

  function snapBack(idx: number) {
    Animated.spring(stripX, { toValue: -(idx * STAGE_W), useNativeDriver: true, bounciness: 4, speed: 22 }).start();
  }

  const isLast         = currentPage === totalSlides - 1;
  const currentPageObj = pages[currentPage] ?? null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{story.title}</Text>
        {/* audio button for current page */}
        {!isLast && currentPageObj && (
          <AudioBar
            key={`audio_page_${currentPage}`}
            page={currentPageObj}
            colors={colors}
            onPositionMs={setPositionMs}
            onPageComplete={handlePageComplete}
          />
        )}
        {isLast && <View style={{ width: 36 }} />}
      </View>

      {/* book stage */}
      <View style={styles.bookStage} {...panResponder.panHandlers}>
        <Animated.View style={[styles.strip, { transform: [{ translateX: stripX }] }]}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View key={i} style={styles.slide}>
              {i === totalSlides - 1 ? (
                <TheEndContent story={story} onNewStory={onNewStory} onClose={onClose} />
              ) : (
                <PageContent
                  page={pages[i]}
                  pageNum={i + 1}
                  total={totalPages}
                  positionMs={i === currentPage ? positionMs : 0}
                />
              )}
            </View>
          ))}
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: shadowAnim, borderRadius: 4 }]}
          pointerEvents="none"
        />
      </View>

      {/* nav bar */}
      {!isLast && (
        <View style={[styles.nav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.navBtn, { opacity: currentPage === 0 ? 0.25 : 1 }]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
            <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Prev</Text>
          </TouchableOpacity>
          <Dots total={totalPages} current={currentPage} colors={colors} />
          <TouchableOpacity style={styles.navBtn} onPress={() => goToPage(currentPage + 1)}>
            <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Next</Text>
            <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Auto-advance toggle */}
      {!isLast && (
        <View style={[styles.autoAdvanceToggle, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => setAutoAdvance(!autoAdvance)}
            style={styles.autoAdvanceButton}
          >
            <View style={[
              styles.autoAdvanceIndicator, 
              { backgroundColor: autoAdvance ? colors.primary : colors.border }
            ]} />
          </TouchableOpacity>
          <Text style={[styles.autoAdvanceLabel, { color: colors.textSecondary }]}>
            Auto-advance pages
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 48,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeIcon:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerTitle: {
    flex: 1, textAlign: 'center', color: '#fff',
    fontSize: 17, fontWeight: '800', marginHorizontal: 8,
  },
  audioBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  audioBtnText: { fontSize: 18 },

  bookStage: {
    flex: 1, marginHorizontal: 12, marginBottom: 8,
    overflow: 'hidden', borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 14,
  },
  strip: { flexDirection: 'row', flex: 1 },
  slide: { width: STAGE_W },

  pagePaper: { flex: 1, backgroundColor: '#fdf8ef' },
  illus:     { width: '100%', height: 210, justifyContent: 'center', alignItems: 'center' },
  illusIcons:{ fontSize: 60 },
  textArea:  { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  pageText:  { fontSize: 18, lineHeight: 30, color: '#2c1810', textAlign: 'justify' },
  karaokeHighlight: {
    backgroundColor: '#fde047',
    color: '#713f12',
    fontWeight: '800',
  },
  wordHighlightCurrent: {
    backgroundColor: '#fde047',
    color: '#713f12',
    fontWeight: '900',
    borderRadius: 4,
  },
  wordHighlightSpoken: {
    color: '#1c1917',
    fontWeight: '600',
  },
  wordUpcoming: {
    color: '#44403c',
    fontWeight: '400',
  },

  pageFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 6,
  },
  rule:    { flex: 1, height: 1, backgroundColor: '#d4c4a0' },
  pageNum: { color: '#8b7355', fontSize: 12, paddingHorizontal: 10 },

  bindingLeft:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, backgroundColor: 'rgba(0,0,0,0.07)' },
  bindingRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.04)' },

  theEndH:         { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 6 },
  theEndTitle:     { fontSize: 17, fontWeight: '700', color: '#2c1810', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  savedBadge:      { backgroundColor: '#22c55e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 14 },
  savedBadgeText:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  newStoryBtn:     { backgroundColor: '#7b2fbe', borderRadius: 20, paddingHorizontal: 36, paddingVertical: 16, marginBottom: 12, elevation: 4 },
  newStoryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  homeLink:        { color: '#8b7355', fontSize: 14, fontWeight: '600' },

  nav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, paddingBottom: 24,
  },
  navBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 8 },
  navArrow: { fontSize: 32, lineHeight: 36, fontWeight: '300' },
  navLabel: { fontSize: 13, fontWeight: '600', marginHorizontal: 4 },
  dots:     { flexDirection: 'row', alignItems: 'center' },
  dot:      { height: 7, borderRadius: 4, marginHorizontal: 3 },
  
  autoAdvanceToggle: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
  },
  autoAdvanceButton: {
    width: 36, height: 20, borderRadius: 10,
    backgroundColor: '#e5e7eb',
    padding: 2,
  },
  autoAdvanceIndicator: {
    width: 16, height: 16, borderRadius: 8,
  },
  autoAdvanceLabel: {
    fontSize: 13, fontWeight: '600', marginLeft: 8,
  },
});