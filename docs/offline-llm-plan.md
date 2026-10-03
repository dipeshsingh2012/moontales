# Moontales — Offline LLM Integration Plan

> Status: **Planned** — not started. Pick this up when ready.

---

## Goal

Replace the current `MockAIService` with a fully on-device LLM (LLaMA 3.2 3B via `react-native-executorch`) so the app generates fresh, unique, cohesive bedtime stories with zero API calls — working completely offline after a one-time model download.

---

## What changes

| Area | Before | After |
|---|---|---|
| Story generation | MockAIService (hardcoded) | LLaMA 3.2 3B on-device |
| Dev environment | Expo Go | expo-dev-client (custom build) |
| Architecture | Old Architecture OK | **New Architecture required** |
| First launch | Instant | Model download screen (~1.8 GB, once) |

---

## Hard prerequisites

> **Expo Go will no longer work.** `react-native-executorch` needs native C++ bindings that Expo Go cannot load. You will need to build and install a **dev client** APK on your Android device. Since you're on WSL, this means using **EAS Build** (cloud build — free tier available).

### Step 1 — Migrate dev environment

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in (create account at expo.dev if needed)
eas login

# Configure EAS in the project
eas build:configure

# Build a dev client APK for Android (runs in cloud, ~10 min)
eas build --profile development --platform android
# → EAS emails a download link for the APK
# → Install it on your phone
# → Start dev server with: npx expo start --dev-client
```

---

## Step 2 — Package installation

```bash
npx expo install \
  react-native-executorch \
  react-native-executorch-expo-resource-fetcher \
  react-native-worklets \
  react-native-blob-util \
  expo-file-system \
  expo-asset
```

---

## Step 3 — Config changes

### app.json additions
```json
{
  "expo": {
    "newArchEnabled": true,
    "android": {
      "minSdkVersion": 26
    }
  }
}
```

### metro.config.js (create if missing)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('pte', 'bin');
module.exports = config;
```

---

## Step 4 — New service: OfflineLLMService

Uses `useLLM` hook from `react-native-executorch`.

### Model choice
| Model | Size | Quality | Speed |
|---|---|---|---|
| LLaMA 3.2 1B (quantized) | ~650 MB | Good | Fast (~8 sec) |
| **LLaMA 3.2 3B (quantized)** | **~1.8 GB** | **Better** | **~20 sec** |

Use `LLAMA3_2_3B_URL` constant from the package. Models hosted by Software Mansion on HuggingFace, downloaded once and cached.

### Story generation prompt

```
SYSTEM:
You are a children's bedtime story writer. Always respond with valid JSON only.
No markdown fences, no extra text.

USER:
Write a {theme} bedtime story for {childName} (age ~4-8).
Exactly {numPages} pages, 60-80 words per page.
Characters: {randomCharacters}. Setting: {randomSetting}.
Story arc: {randomConflict} → resolution → peaceful ending.

Return ONLY:
{
  "title": "...",
  "pages": [
    { "text": "..." },
    ...
  ]
}
```

### Randomisation seed (ensures every story is unique)
```typescript
const CHAR_PAIRS = [['Luna','Max'],['Pip','Zara'],['Oliver','Bea'],['Mia','Rex'], ...]
const SETTINGS   = ['enchanted forest','cloud city','underwater kingdom','volcano island', ...]
const CONFLICTS  = ['lost a magical item','made a surprising new friend','found a secret door', ...]
```

---

## Step 5 — New screens

### `src/screens/ModelDownloadScreen.tsx`
- Shown once on first launch (gated by AsyncStorage flag)
- Shows `llama.downloadProgress * 100`% progress bar
- "Download over WiFi recommended" warning
- Estimated size and time shown
- On complete → navigate to Home, save flag to AsyncStorage

### Enhanced `StoryGeneratingScreen` (inline in StoryViewScreen)
- Animated moon / stars during ~15–30 sec generation
- Cancel button
- "Writing your story..." + theme emoji

---

## Step 6 — StoryContext changes

Since `useLLM` is a React hook, it must live in a component. Plan:

1. Create `LLMProvider` component that wraps `useLLM`
2. Expose `generateOfflineStory(options)` via context
3. Replace `getAIService()` logic in `StoryContext`

```typescript
// In LLMProvider
const llama = useLLM({
  modelSource: LLAMA3_2_3B_URL,
  tokenizerSource: LLAMA3_2_TOKENIZER_URL,
  contextWindowLength: 2048,
});

// generate function
const generateOfflineStory = async (opts: StoryGenerationOptions): Promise<Story> => {
  const prompt = buildPrompt(opts);
  await llama.generate(prompt);
  const raw = llama.response;
  const json = JSON.parse(jsonrepair(raw)); // jsonrepair handles malformed output
  return mapToStory(json, opts);
};
```

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM output not valid JSON | `jsonrepair` (bundled dep of react-native-executorch) |
| 3B model too slow (old phones) | Offer 1B model fallback in Settings |
| New Architecture breaks existing screens | Test each screen after migration; fix issues one by one |
| WSL can't do local native build | Use EAS cloud build (free tier) |
| Model download fails mid-way | `expo-file-system` download with resume support |
| Generation too slow (~20–30 sec) | Show animated progress, allow background generation |

---

## Estimated effort

| Task | Time |
|---|---|
| EAS setup + dev client build | 1 hr |
| Package install + config | 30 min |
| OfflineLLMService + prompt tuning | 3 hrs |
| ModelDownloadScreen | 1 hr |
| StoryContext wiring | 1 hr |
| Testing + prompt iteration | Variable |

---

## Voice narration (Phase 3, separate plan)

After offline LLM is working, the next phase is adding parent voice narration:

- Parent records themselves reading each story page using the existing `VoiceService`
- Audio files saved per `storyId/pageIndex` in `expo-file-system`
- Playback auto-advances pages as audio plays
- This means the child always hears the **parent's real voice** telling a brand new story

No voice cloning or TTS needed — just the parent's recorded audio.
