import { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { StoryScreen } from './components/StoryScreen';
import { SummaryScreen } from './components/SummaryScreen';

export type AppState = 'setup' | 'story' | 'summary';

export interface ChildProfile {
  name: string;
  age: number;
  storytellingTone: 'calming' | 'energetic' | 'sad' | 'adventurous' | 'none';
  parentPrompt: string;
  uploadedImages: File[];
  initialState: 'wound-up' | 'normal' | 'almost-there';
  generatedStory?: string;
}

export interface StorySummary {
  title: string;
  duration: string;
  sleepOnsetTime: string;
  driftCurve: number[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [storySummary, setStorySummary] = useState<StorySummary | null>(null);

  const handleStartStory = (profile: ChildProfile) => {
    setChildProfile(profile);
    setAppState('story');
  };

  const handleStoryComplete = (summary: StorySummary) => {
    setStorySummary(summary);
    setAppState('summary');
  };

  const handleStartOver = () => {
    setAppState('setup');
    setChildProfile(null);
    setStorySummary(null);
  };

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      {appState === 'setup' && <SetupScreen onStart={handleStartStory} />}
      {appState === 'story' && childProfile && (
        <StoryScreen profile={childProfile} onComplete={handleStoryComplete} />
      )}
      {appState === 'summary' && storySummary && (
        <SummaryScreen summary={storySummary} onStartOver={handleStartOver} />
      )}
    </div>
  );
}
