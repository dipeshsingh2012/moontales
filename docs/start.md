# Bedtime Stories App - Detailed Project Plan

## Project Overview
A React Native mobile app that generates personalized bedtime stories for children using AI, with a book-like interface featuring illustrations and animations.

---

## Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo (easier setup, cross-platform)
- **Navigation**: React Navigation (stack + tabs)
- **State Management**: React Context API or Zustand (lightweight)
- **UI Components**: React Native Paper or NativeBase
- **Animations**: React Native Reanimated
- **Voice**: Expo Speech (TTS - future), Expo AV (voice recording)
- **Storage**: AsyncStorage (local favorites), potentially SQLite for structured data

### Backend (Optional - can start with direct API calls)
- **Option 1**: Direct AI API calls from mobile (simpler for MVP)
- **Option 2**: Lightweight backend (Node.js/Express or Python/FastAPI) to:
  - Hide API keys
  - Rate limit
  - Cache stories
  - Handle image generation

### AI Services (Pluggable Architecture)
- **Story Generation**: OpenAI GPT-4, Claude, or local models (Ollama)
- **Image Generation**: DALL-E, Stable Diffusion, or placeholder images initially
- **Voice Transcription**: OpenAI Whisper or Expo Speech (if available)

---

## Architecture

### Layered Architecture
```
┌─────────────────────────────────────┐
│         UI Layer (Screens)          │
│  - Home, StoryView, Library, Settings│
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Business Logic Layer           │
│  - StoryManager, VoiceHandler,      │
│    StorageManager                   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Service Layer (Pluggable)      │
│  - AIService (OpenAI/Claude/Local)  │
│  - ImageService                     │
│  - TranscriptionService             │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Data Layer                  │
│  - AsyncStorage, External APIs     │
└─────────────────────────────────────┘
```

### Key Design Patterns
- **Repository Pattern**: For AI services (easy to swap providers)
- **Factory Pattern**: For creating different story types
- **Observer Pattern**: For story generation progress updates
- **Strategy Pattern**: For different AI providers

---

## Core Features Breakdown

### Phase 1: MVP (Minimum Viable Product)
1. **Story Generation**
   - Text input for story prompts
   - Basic AI integration (OpenAI GPT-3.5/4)
   - Simple story display with pagination
   - Placeholder illustrations

2. **Basic UI**
   - Home screen with "Create Story" button
   - Story viewing screen with page-by-page navigation
   - Simple settings screen

3. **Local Storage**
   - Save favorite stories
   - View story library

### Phase 2: Enhanced Experience
4. **Voice Input**
   - Record child's voice input
   - Transcribe to text (Whisper or similar)
   - Send transcription to AI

5. **Rich UI**
   - Book-like page turns with animations
   - Custom illustrations (AI-generated or curated)
   - Theme customization (day/night mode)

6. **Story Customization**
   - Character names
   - Story length
   - Theme selection (adventure, animals, space, etc.)

### Phase 3: Advanced Features
7. **Text-to-Speech**
   - Optional story narration
   - Voice selection
   - Reading speed control

8. **Image Generation**
   - AI-generated illustrations per page
   - Style selection (cartoon, watercolor, etc.)

9. **Advanced Story Features**
   - Story continuation (sequels)
   - Character consistency across stories
   - Story templates/presets

---

## Data Models

### Story
```typescript
{
  id: string
  title: string
  content: string // Full story text
  pages: Array<{
    text: string
    imageUrl?: string
    illustrationPrompt?: string
  }>
  metadata: {
    createdAt: Date
    theme: string
    characters: string[]
    length: 'short' | 'medium' | 'long'
    aiProvider: string
  }
  isFavorite: boolean
}
```

### User Preferences
```typescript
{
  childName: string
  preferredThemes: string[]
  defaultStoryLength: string
  aiProvider: string
  apiKey?: string // If user provides their own
  theme: 'light' | 'dark'
}
```

---

## User Flow

### Main Flow
1. **Launch App** → Home Screen
2. **Create Story** → Input Screen
   - Option A: Type prompt
   - Option B: Voice input (press mic, speak, transcribe)
3. **Customize** (optional) → Select theme, length, characters
4. **Generate** → Loading screen with animation
5. **View Story** → Book-like interface with page turns
6. **Actions** → Save to favorites, share, regenerate
7. **Library** → View saved stories, replay, delete

### Settings Flow
- Configure AI provider
- Enter API keys (or use backend)
- Set child preferences
- Theme settings

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up Expo project
- Basic navigation structure
- AI service abstraction layer
- Simple story generation (text only)
- Basic story display

### Phase 2: Core Features (Week 3-4)
- Voice input integration
- Story library with AsyncStorage
- Improved UI with animations
- Placeholder illustrations

### Phase 3: Polish (Week 5-6)
- Book-like page transitions
- Image generation integration
- Story customization options
- Settings screen
- Error handling and edge cases

### Phase 4: Advanced (Week 7+)
- Text-to-speech
- Advanced story features
- Performance optimization
- Testing and bug fixes

---

## Key Considerations

### AI Integration
- **Start Simple**: Direct API calls from mobile (quick start)
- **Security**: Never hardcode API keys - use environment variables or backend
- **Cost**: Implement rate limiting, consider local models for cost reduction
- **Fallback**: Have backup AI provider or cached stories

### Child Safety
- Content filtering (no inappropriate content)
- Simple, large UI elements
- No external links or ads
- Parental controls/gate for settings

### Performance
- Lazy load story pages
- Cache generated stories
- Optimize image sizes
- Offline mode for saved stories

### Accessibility
- Large text option
- High contrast mode
- Voice navigation (future)
- Screen reader support

---

## File Structure (Proposed)

```
bedtime-stories/
├── app.json
├── package.json
├── App.tsx
├── src/
│   ├── components/
│   │   ├── StoryBook/
│   │   ├── VoiceInput/
│   │   ├── LoadingStates/
│   │   └── common/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── StoryViewScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AIService.interface.ts
│   │   │   ├── OpenAIService.ts
│   │   │   └── ClaudeService.ts
│   │   ├── storage/
│   │   │   └── StorageService.ts
│   │   └── voice/
│   │       └── VoiceService.ts
│   ├── context/
│   │   ├── StoryContext.tsx
│   │   └── SettingsContext.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── helpers.ts
├── assets/
│   ├── images/
│   └── fonts/
└── .env.example
```

---

## Next Steps When Ready to Implement

1. **Install Node.js** (if not already installed)
2. **Create Expo project**: `npx create-expo-app bedtime-stories`
3. **Set up environment variables** for API keys
4. **Implement core screens** one by one
5. **Test on device/emulator** early and often
6. **Iterate based on your child's feedback**

---