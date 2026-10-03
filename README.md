# 🌙 MoonTales Mobile App

> A magical React Native & Expo bedtime stories app for children — featuring interactive touch games, instant progressive reading, spoken voice cues, and synchronized karaoke narration.

[![Expo](https://img.shields.io/badge/Expo-SDK%2052%2B-000020)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76%2B-61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Highlights & Features

### 🌟 1. Interactive Star-Catching Loader Game
- **Touch-Based Mini Game**: Keeps kids happily engaged while their story is being crafted.
- **Drifting Stars**: Bedtime stars float gently across the starry night sky. Kids tap to catch and pop them with sparkle animations and a live counter (*"⭐ You caught 8 bedtime stars!"*).
- **Bedtime & Nature Facts**: Automatically rotates fun, calming educational facts (e.g. why sea otters hold hands while sleeping, moonquakes on the Moon, how owls sleep).
- **Gently Glowing Moon**: Soft visual progress atmosphere with status updates.

### 📖 2. Instant Progressive Story Delivery
- **Read as Soon as Page 1 is Ready**: Instead of waiting 1–2 minutes for the full book to finish, the reader opens within ~20–30 seconds!
- **Background Page Streaming**: Subsequent pages and illustrations stream seamlessly in the background.
- **Graceful Reading Pacing**: If a child turns ahead before a page's illustration or audio is ready, the text remains readable with a gentle *"✨ Painting illustration... 🎨"* badge.
- **Smart Auto-Advance**: Automatically pauses auto-advance until the next page finishes generating, then continues playing narration smoothly.

### 🎙️ 3. Spoken Voice & Text Cues (Zero Device Keys)
- **Microphone Voice Cues**: Parents or children tap the mic to speak their story ideas.
- **Gemini Multimodal Transcription**: Uploads audio to the MoonTales API where Gemini parses speech into:
  - A polished bedtime story prompt
  - Matching theme (Space, Fantasy, Animals, Bedtime, etc.)
  - Character list
  - Visual and story cue tags
- **Visual Cue Chips**: Users can add, tap, or remove custom cue chips (e.g. `✨ glowing moon`, `🥕 rocket`, `🐾 puppy`) to steer the story.

### 🎵 4. Synchronized Karaoke Narration
- **Word-Level Highlighting**: Uses character-level timestamp alignments from the backend TTS engine (GCP Cloud TTS / ElevenLabs) to highlight words in real time as the narrator speaks.
- **Warm Bedtime Narration**: High-fidelity narration with soothing bedtime cadence (supports Indian English, US English, and cloned voices).
- **Paper & Book Animations**: Realistic book-turn gestures with spring physics, shadows, and auto-advance toggling.

---

## App Screens

- **Home Screen**: 1-tap instant bedtime themes, search ideas, prominent voice input mic, surprise me button, and recent story shelf.
- **Create Screen**: Detailed customization with custom prompt, speech-to-text mic, theme selector, story length (5-min standard), character inputs, and interactive visual cue chips.
- **Story View / Reader**: Interactive book-turn interface with karaoke highlighter, illustration viewing, and audio playback controls.
- **Library Screen**: Persistent offline/cloud library of all previously created bedtime stories.

---

## Project Structure

```
moontales/
├── App.tsx                     # App entry point
├── app.json                    # Expo configuration
├── src/
│   ├── components/
│   │   ├── StoryBook/          # Book-turn reader with pan gestures & karaoke
│   │   ├── StoryLoader/        # Star-catching touch minigame & bedtime facts
│   │   ├── StoryInput/         # Form inputs & chips
│   │   └── VoiceCloning/       # Voice cloning UI
│   ├── context/
│   │   ├── StoryContext.tsx    # Progressive polling & story state
│   │   ├── ThemeContext.tsx    # Nighttime & bedtime palettes
│   │   └── AuthContext.tsx     # Firebase authentication
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Tab & stack navigation
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main dashboard & instant themes
│   │   ├── CreateScreen.tsx    # Voice & text cue creator
│   │   ├── StoryViewScreen.tsx # Full-screen reader
│   │   ├── LibraryScreen.tsx   # Saved stories
│   │   └── SettingsScreen.tsx  # Preferences & voice settings
│   ├── services/
│   │   ├── api/                # MoontalesApiService (backend client)
│   │   ├── audio/              # expo-audio engine with status listeners
│   │   ├── voice/              # Microphone recording & transcription
│   │   └── storage/            # Local AsyncStorage cache
│   └── types/                  # Shared TypeScript interfaces
└── assets/                     # Fonts, icons, and bedtime graphics
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Expo Go](https://expo.dev/client) app installed on your physical iOS/Android phone, or an Android/iOS emulator

### 1. Install Dependencies
```bash
git clone https://github.com/dipeshsingh2012/moontales.git
cd moontales

npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Set the backend API URL (local network, tunnel, or production server):
```ini
EXPO_PUBLIC_API_URL=https://your-backend-tunnel.loca.lt
```

> **Note for Local Tunnel**: If using Localtunnel or ngrok, `MoontalesApiService` automatically includes the `bypass-tunnel-reminder: 1` header to prevent tunnel interstitial screens.

### 3. Start Development Server
```bash
npx expo start
```

- Scan the QR code using the **Expo Go** app on Android or the **Camera** app on iOS.
- Or press `a` to launch Android Emulator / `i` for iOS Simulator.

---

## TypeScript Verification

To verify that all types and components compile cleanly:
```bash
npx tsc --noEmit
```

---

## License

MIT License. See [LICENSE](./LICENSE) for details.
