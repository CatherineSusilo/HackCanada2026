import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2 } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { ChildDashboard } from './components/ChildDashboard';
import { ChildOnboarding } from './components/ChildOnboarding';
import { StoryRoadmap } from './components/StoryRoadmap';
import { SetupScreen } from './components/SetupScreen';
import { StoryScreen } from './components/StoryScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { Sidebar, SidebarView } from './components/Sidebar';
import { BehavioralStats } from './components/BehavioralStats';
import { StoryArchive } from './components/StoryArchive';
import { DrawingsManager } from './components/DrawingsManager';
import { StoryThemes } from './components/StoryThemes';
import { AISettings } from './components/AISettings';

export type AppState = 'dashboard' | 'onboarding' | 'roadmap' | 'setup' | 'story' | 'summary';

export interface ChildProfile {
  childId: string;
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
  childId: string;
}

export default function App() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [sidebarView, setSidebarView] = useState<SidebarView>('dashboard');
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [storyConfig, setStoryConfig] = useState<any>(null);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [storySummary, setStorySummary] = useState<StorySummary | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize user profile in backend when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || isInitializing) return;

    const initializeUser = async () => {
      setIsInitializing(true);
      try {
        const token = await getAccessTokenSilently();
        
        await fetch('http://localhost:3001/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            picture: user.picture,
          }),
        });
        
        console.log('✓ User profile initialized');
      } catch (error) {
        console.error('Failed to initialize user:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  const handleSelectChild = (child: any) => {
    setSelectedChild(child);
    setAppState('roadmap');
  };

  const handleStartStory = (config: any) => {
    setStoryConfig(config);
    setAppState('setup');
  };

  const handleConfigureStory = (profile: ChildProfile) => {
    setChildProfile(profile);
    setAppState('story');
  };

  const handleStoryComplete = (summary: StorySummary) => {
    setStorySummary(summary);
    setAppState('summary');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
    setSidebarView('dashboard');
    setSelectedChild(null);
    setStoryConfig(null);
    setChildProfile(null);
    setStorySummary(null);
  };

  const handleSidebarViewChange = (view: SidebarView) => {
    setSidebarView(view);
    if (view === 'dashboard') {
      setAppState('dashboard');
      setSelectedChild(null);
      setStoryConfig(null);
    }
  };

  const handleBackToRoadmap = () => {
    setAppState('roadmap');
    setStoryConfig(null);
  };

  const handleStartOnboarding = () => {
    setAppState('onboarding');
  };

  const handleOnboardingComplete = () => {
    setAppState('dashboard');
  };

  // Loading state
  if (isLoading || (isAuthenticated && isInitializing)) {
    return (
      <div 
        className="size-full flex flex-col items-center justify-center"
        style={{
          backgroundColor: '#e4d5b7',
          backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
          backgroundSize: '400px 400px',
        }}
      >
        <img 
          src="https://raw.githubusercontent.com/DzhanybekZakiriiaev/logo/refs/heads/main/logo.png" 
          alt="StoryDrift" 
          className="w-32 opacity-90 mb-4"
          style={{ filter: 'sepia(0.1) contrast(1.1)' }}
        />
        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.7)' }}>
          opening the dream book...
        </p>
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Main app (authenticated)
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      {appState === 'setup' && <SetupScreen onStart={handleStartStory} />}
      {appState === 'story' && childProfile && (
        <StoryScreen profile={childProfile} onComplete={handleStoryComplete} />
      )}
      {appState === 'summary' && storySummary && (
        <SummaryScreen summary={storySummary} onStartOver={handleBackToDashboard} />
      )}
    </>
  );
}
