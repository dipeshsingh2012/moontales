# Moontales - Bedtime Stories App

A React Native mobile app that generates personalized bedtime stories for children using AI.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
- iOS: Press `i` in the terminal or run `npm run ios`
- Android: Press `a` in the terminal or run `npm run android`
- Web: Press `w` in the terminal or run `npm run web`

## Project Structure

```
moontales/
├── App.tsx                 # App entry point
├── app.json               # Expo configuration
├── src/
│   ├── components/        # Reusable components
│   ├── context/          # React Context providers
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   ├── services/         # Business logic services
│   │   ├── ai/          # AI service implementations
│   │   └── storage/     # Local storage services
│   └── types/           # TypeScript type definitions
├── assets/              # Images, fonts, etc.
└── docs/                # Project documentation
```

## Features

### Phase 1 (Current)
- ✅ Basic navigation structure
- ✅ AI service abstraction layer
- ✅ Story generation (mock implementation)
- ✅ Type definitions
- ✅ Context for state management

### Phase 2 (Planned)
- Voice input integration
- Story library with AsyncStorage
- Improved UI with animations
- Placeholder illustrations

### Phase 3 (Planned)
- Book-like page transitions
- Image generation integration
- Story customization options
- Settings screen

## Development

### Adding a New AI Provider

1. Create a new service in `src/services/ai/` implementing `IAIService`
2. Add the provider to the switch in `StoryContext.tsx`
3. Update the user preferences type if needed

### Adding a New Screen

1. Create the screen component in `src/screens/`
2. Add the screen to `AppNavigator.tsx`
3. Update navigation as needed

## License

ISC
