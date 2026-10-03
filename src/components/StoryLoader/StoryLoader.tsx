import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FUN_FACTS = [
  "Did you know? Sea otters hold hands while sleeping so they don't drift away! 🦦",
  "Did you know? The Moon has moonquakes, just like Earth has earthquakes! 🌙",
  "Did you know? Koalas can sleep up to 20 hours a day in eucalyptus trees! 🐨",
  "Did you know? Sloths sleep upside down and move super slow! 🦥",
  "Did you know? Footprints on the Moon will stay there for millions of years! 🚀",
  "Did you know? Flamingos can sleep while standing on one leg! 🦩",
  "Did you know? Whales sleep with half their brain awake so they remember to breathe! 🐳",
  "Did you know? Owls can rotate their heads 270 degrees! 🦉",
  "Did you know? Shooting stars are actually tiny specks of dust burning up brightly! ⭐",
  "Did you know? Honeybees do a little waggle dance to tell friends where sweet flowers are! 🐝",
];

const STAR_EMOJIS = ['⭐', '🌟', '✨', '💫'];

interface FloatingStarData {
  id: number;
  emoji: string;
  size: number;
  startX: number;
  animX: Animated.Value;
  animY: Animated.Value;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
  speed: number;
}

interface StoryLoaderProps {
  status?: string;
  themeTitle?: string;
  onDismiss?: () => void;
}

export function StoryLoader({ status, themeTitle, onDismiss }: StoryLoaderProps) {
  const { colors } = useTheme();
  const [starsCaught, setStarsCaught] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Moon glow animation
  const moonGlow = useRef(new Animated.Value(1)).current;

  // Star generation counter
  const starIdCounter = useRef(0);
  const [activeStars, setActiveStars] = useState<FloatingStarData[]>([]);

  // Pulse the moon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(moonGlow, {
          toValue: 1.15,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(moonGlow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [moonGlow]);

  // Rotate fun facts every 6 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 6000);
    return () => clearInterval(factInterval);
  }, []);

  // Spawn a floating star
  const spawnStar = (id: number): FloatingStarData => {
    const size = Math.floor(Math.random() * 16) + 28; // 28 to 44px
    const startX = Math.random() * (SCREEN_W - 80) + 20;
    const emoji = STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)];
    const speed = Math.floor(Math.random() * 4000) + 5000; // 5-9 seconds float time

    const animX = new Animated.Value(startX);
    const animY = new Animated.Value(SCREEN_H + 40);
    const scaleAnim = new Animated.Value(1);
    const opacityAnim = new Animated.Value(1);

    // Animate upward with gentle sway
    const swayX = startX + (Math.random() * 80 - 40);

    Animated.parallel([
      Animated.timing(animY, {
        toValue: -80,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animX, {
          toValue: swayX,
          duration: speed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animX, {
          toValue: startX,
          duration: speed / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        // Recycle star
        setActiveStars((prev) => prev.filter((s) => s.id !== id));
      }
    });

    return {
      id,
      emoji,
      size,
      startX,
      animX,
      animY,
      scaleAnim,
      opacityAnim,
      speed,
    };
  };

  // Keep 5-6 stars floating continuously
  useEffect(() => {
    const initialStars: FloatingStarData[] = [];
    for (let i = 0; i < 5; i++) {
      starIdCounter.current += 1;
      const star = spawnStar(starIdCounter.current);
      // Give initial random Y offset so they don't all start at bottom
      star.animY.setValue(SCREEN_H * 0.2 + (i * SCREEN_H) / 6);
      initialStars.push(star);
    }
    setActiveStars(initialStars);

    const spawnInterval = setInterval(() => {
      setActiveStars((prev) => {
        if (prev.length < 6) {
          starIdCounter.current += 1;
          return [...prev, spawnStar(starIdCounter.current)];
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(spawnInterval);
  }, []);

  // Handle star pop
  const handlePopStar = (star: FloatingStarData) => {
    // Pop animation
    Animated.parallel([
      Animated.spring(star.scaleAnim, {
        toValue: 2,
        useNativeDriver: true,
      }),
      Animated.timing(star.opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveStars((prev) => prev.filter((s) => s.id !== star.id));
    });

    setStarsCaught((c) => {
      const next = c + 1;
      // Change fact immediately when catching a star every 3 taps!
      if (next % 3 === 0) {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
      }
      return next;
    });

    // Spawn a burst effect
    const burstId = Date.now();
    setBursts((prev) => [
      ...prev.slice(-3),
      { id: burstId, x: star.startX, y: 300 },
    ]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 600);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0d0b1e' }]}>
      {/* Background Starry Sky Elements */}
      <View style={styles.skyGlow} />

      {/* Floating interactive stars */}
      {activeStars.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.floatingStar,
            {
              transform: [
                { translateX: star.animX },
                { translateY: star.animY },
                { scale: star.scaleAnim },
              ],
              opacity: star.opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            onPress={() => handlePopStar(star)}
            style={styles.starTouchable}
          >
            <Text style={{ fontSize: star.size }}>{star.emoji}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Top Header & Star Counter */}
      <View style={styles.topHeader}>
        <View style={styles.counterBadge}>
          <Text style={styles.counterEmoji}>⭐</Text>
          <Text style={styles.counterText}>
            {starsCaught} {starsCaught === 1 ? 'star caught' : 'stars caught'}!
          </Text>
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center Animated Moon & Title */}
      <View style={styles.centerArea}>
        <Animated.View
          style={[
            styles.moonWrapper,
            {
              transform: [{ scale: moonGlow }],
            },
          ]}
        >
          <Text style={styles.moonEmoji}>🌙</Text>
        </Animated.View>

        <Text style={styles.titleText}>
          {themeTitle ? `Crafting ${themeTitle}...` : 'Weaving your bedtime story...'}
        </Text>

        <Text style={styles.subtitleText}>
          {status || 'Painting illustrations & warming up the narrator 🎨'}
        </Text>

        <View style={styles.hintBox}>
          <Text style={styles.hintEmoji}>✨</Text>
          <Text style={styles.hintText}>Tap the floating stars to catch them!</Text>
        </View>
      </View>

      {/* Bottom Fun Bedtime Fact Card */}
      <View style={styles.factCard}>
        <View style={styles.factHeader}>
          <Text style={styles.factBadge}>BEDTIME FACT</Text>
          <Text style={styles.factPageIndicator}>
            {factIndex + 1}/{FUN_FACTS.length}
          </Text>
        </View>
        <Text style={styles.factText}>{FUN_FACTS[factIndex]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  skyGlow: {
    position: 'absolute',
    top: '15%',
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    borderRadius: SCREEN_W * 0.6,
    backgroundColor: '#3b1c6e',
    opacity: 0.25,
  },
  floatingStar: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  starTouchable: {
    padding: 10,
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 8,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 224, 71, 0.18)',
    borderColor: 'rgba(253, 224, 71, 0.4)',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  counterText: {
    color: '#fef08a',
    fontSize: 14,
    fontWeight: '800',
  },
  dismissBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centerArea: {
    alignItems: 'center',
    zIndex: 5,
    paddingHorizontal: 16,
  },
  moonWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  moonEmoji: {
    fontSize: 68,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  hintEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  hintText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  factCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  factHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factBadge: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  factPageIndicator: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  factText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
});
