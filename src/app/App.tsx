import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2 } from 'lucide-react';
import { useApi } from '../lib/api';
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
import { CharacterManager } from './components/CharacterManager';
import { getNextTheme } from './data/roadmapThemes';

export type AppState = 'dashboard' | 'onboarding' | 'roadmap' | 'setup' | 'story' | 'summary' | 'generating-next';

export interface StoryCharacter {
  id: string;
  name: string;
  description: string;
  personality: string;
  icon: string;
  voiceId?: string;
}

export interface CharacterVoice {
  name: string;
  voiceId: string;
}

export interface ChildProfile {
  childId: string;
  name: string;
  age: number;
  storytellingTone: 'calming' | 'energetic' | 'sad' | 'adventurous' | 'none';
  parentPrompt: string;
  uploadedImages: File[];
  initialState: 'wound-up' | 'normal' | 'almost-there';
  interactionFrequency: 'none' | 'every' | 'every3' | 'every5';
  storyLength: 'short' | 'medium' | 'long';
  characters: StoryCharacter[];
  characterVoices?: CharacterVoice[];
  characterIds?: string[];
  backgroundMusic?: boolean;
  generatedStory?: string;
  interactions?: any[];
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
  const api = useApi();
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

  const handleStoryComplete = async (summary: StorySummary) => {
    setStorySummary(summary);
    const next = storyConfig ? getNextTheme(storyConfig.theme) : null;
    if (next && childProfile) {
      setStoryConfig({
        ...storyConfig!,
        theme: next.title,
        themeDescription: next.theme,
      });
      setAppState('generating-next');
      setIsGeneratingNext(true);
      try {
        const nextProfile: ChildProfile = {
          ...childProfile,
          parentPrompt: `${next.title}: ${next.theme}`,
        };
        const data = await api.generateStory(nextProfile);
        (window as any).storyImagePrompts = data.imagePrompts || [];
        setChildProfile({
          ...nextProfile,
          generatedStory: data.story,
          interactions: data.interactions || [],
          characterVoices: data.characterVoices || [],
          characterIds: data.characterIds || [],
        });
        setAppState('story');
      } catch (err) {
        console.error('Failed to generate next story:', err);
        setAppState('summary');
      } finally {
        setIsGeneratingNext(false);
      }
    } else if (next) {
      setStoryConfig({
        ...storyConfig!,
        theme: next.title,
        themeDescription: next.theme,
      });
      setAppState('setup');
    } else {
      setAppState('summary');
    }
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
    setAppState('dashboard');
    if (view === 'dashboard') {
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

  const handleVoiceSettings = () => {
    setSidebarView('ai-settings');
    setAppState('dashboard');
  };

  const handleNextStory = () => {
    if (!storyConfig) return;
    const next = getNextTheme(storyConfig.theme);
    if (next) {
      setStoryConfig({
        ...storyConfig,
        theme: next.title,
        themeDescription: next.theme,
      });
      setAppState('setup');
    } else {
      handleBackToDashboard();
    }
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
  // Full-screen story/summary views
  const handleSetupNavigate = (view: string) => {
    setSidebarView(view as SidebarView);
    setAppState('dashboard');
  };

  const handleReplayStory = (story: any) => {
    const profile: ChildProfile = {
      childId: story.childId,
      name: story.childName || 'Child',
      age: story.childAge || 5,
      storytellingTone: story.storytellingTone || 'calming',
      parentPrompt: story.parentPrompt || '',
      uploadedImages: [],
      initialState: 'normal',
      interactionFrequency: 'none',
      storyLength: 'medium',
      characters: [],
      generatedStory: story.storyContent,
      interactions: story.interactions || [],
    };
    setChildProfile(profile);
    setAppState('story');
  };

  if (appState === 'setup') {
    return (
      <>
        <Sidebar currentView={sidebarView} onViewChange={handleSidebarViewChange} />
        <SetupScreen onStart={handleConfigureStory} onVoiceSettings={handleVoiceSettings} prefilledConfig={storyConfig} onBack={handleBackToRoadmap} onNavigate={handleSetupNavigate} />
      </>
    );
  }

  if (appState === 'roadmap' && selectedChild) {
    return (
      <>
        <Sidebar currentView={sidebarView} onViewChange={handleSidebarViewChange} />
        <StoryRoadmap child={selectedChild} onStartStory={handleStartStory} onBack={handleBackToDashboard} />
      </>
    );
  }

  if (appState === 'generating-next') {
    return (
      <div className="size-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)' }}>
        <Loader2 className="w-16 h-16 animate-spin text-indigo-300 mb-4" />
        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '24px', color: 'rgba(255,255,255,0.9)' }}>
          creating the next story...
        </p>
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet" />
      </div>
    );
  }

  if (appState === 'story' && childProfile) {
    return <StoryScreen profile={childProfile} onComplete={handleStoryComplete} onExit={handleBackToDashboard} />;
  }

  if (appState === 'summary' && storySummary) {
    return <SummaryScreen summary={storySummary} onStartOver={handleBackToDashboard} onNextStory={handleNextStory} hasNextTheme={!!storyConfig && !!getNextTheme(storyConfig.theme)} />;
  }

  // Dashboard with sidebar
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex">
      <Sidebar currentView={sidebarView} onViewChange={handleSidebarViewChange} />
      
      <div className="flex-1 overflow-auto">
        {appState === 'roadmap' && selectedChild && (
          <StoryRoadmap child={selectedChild} onStartStory={handleStartStory} onBack={handleBackToDashboard} />
        )}

        {sidebarView === 'dashboard' && appState === 'dashboard' && (
          <ChildDashboard onSelectChild={handleSelectChild} onStartOnboarding={handleStartOnboarding} />
        )}
        
        {appState === 'onboarding' && (
          <ChildOnboarding onComplete={handleOnboardingComplete} />
        )}
        
        {sidebarView === 'statistics' && (
          <BehavioralStats />
        )}
        
        {sidebarView === 'archive' && (
          <StoryArchive onReplay={handleReplayStory} />
        )}
        
        {sidebarView === 'drawings' && (
          <DrawingsManager />
        )}
        
        {sidebarView === 'themes' && (
          <StoryThemes />
        )}
        
        {sidebarView === 'characters' && (
          <CharacterManager />
        )}
        
        {sidebarView === 'ai-settings' && (
          <AISettings />
        )}
      </div>
    </div>
  );
}
