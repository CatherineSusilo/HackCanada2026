import { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChildProfile, StorySummary } from '../App';
import { DriftMeter } from './DriftMeter';
import { generateStorySegment } from '../utils/storyGenerator';
import { calculateDriftScore } from '../utils/driftCalculator';
import { useApi } from '../../lib/api';

interface StoryScreenProps {
  profile: ChildProfile;
  onComplete: (summary: StorySummary) => void;
}

export function StoryScreen({ profile, onComplete }: StoryScreenProps) {
  const api = useApi();
  const [driftScore, setDriftScore] = useState(0);
  const fullStory = profile.generatedStory || 'Once upon a time...';
  const paragraphs = fullStory.split('\n').filter(p => p.trim().length > 0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [storyTitle] = useState(
    `${profile.name}'s Bedtime Story`
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [driftHistory, setDriftHistory] = useState<number[]>([0]);
  const [storySessionId, setStorySessionId] = useState<string | null>(null);

  const imagePromptsRef = useRef<any[]>((window as any).storyImagePrompts || []);
  const startTimeRef = useRef<number>(Date.now());
  const storyPhaseRef = useRef<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const initialScore = calculateDriftScore(profile.initialState, 0);
    setDriftScore(initialScore);
    setDriftHistory([initialScore]);
    
    const createSession = async () => {
      try {
        const session = await api.createStory({
          childId: profile.childId,
          storyTitle: storyTitle,
          storyContent: fullStory,
          parentPrompt: profile.parentPrompt,
          storytellingTone: profile.storytellingTone,
          initialState: profile.initialState,
          initialDriftScore: initialScore,
          imagePrompts: imagePromptsRef.current,
          generatedImages: [],
          modelUsed: 'gemini-2.5-flash',
        });
        
        setStorySessionId(session.id);
        console.log('✓ Story session created:', session.id);
      } catch (error) {
        console.error('Failed to create story session:', error);
      }
    };

    createSession();
  }, [profile.initialState]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || currentParagraphIndex >= paragraphs.length || isSpeaking) return;

    const paragraph = paragraphs[currentParagraphIndex];
    
    setCurrentParagraph(paragraph);
    
    const imagePrompt = imagePromptsRef.current[currentParagraphIndex];
    console.log(`Paragraph ${currentParagraphIndex}: imagePrompt =`, imagePrompt);
    
    if (imagePrompt) {
      fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt.prompt,
          paragraphIndex: currentParagraphIndex
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          console.log('✓ Generated image URL:', data.imageUrl);
          setBackgroundImage(data.imageUrl);
        }
      })
      .catch(error => {
        console.error('Failed to generate image:', error);
        const fallbackPhotos = [
          '1519681393784-d120267933ba',
          '1444703851336-926a91bfc5f1',
          '1464822759023-fed622ff2c3b'
        ];
        const photoId = fallbackPhotos[currentParagraphIndex % fallbackPhotos.length];
        setBackgroundImage(`https://images.unsplash.com/photo-${photoId}?w=1920&h=1080&fit=crop`);
      });
    }
    
    speakParagraph(paragraph);

  }, [isPlaying, currentParagraphIndex, paragraphs, isSpeaking]);

  const speakParagraph = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const newScore = calculateDriftScore(profile.initialState, elapsedSeconds);
      setDriftScore(newScore);
      setDriftHistory((prev) => [...prev, newScore]);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.6, 1.0 - newScore / 200);
      utterance.volume = Math.max(0.4, 1.0 - newScore / 150);
      utterance.pitch = Math.max(0.8, 1.0 - newScore / 400);

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentParagraphIndex(prev => prev + 1);
        
        if (currentParagraphIndex >= paragraphs.length - 1 || newScore >= 85) {
          setTimeout(() => {
            completeStory();
          }, 2000);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const completeStory = async () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();

    const totalMinutes = Math.floor(elapsedSeconds / 60);
    const remainingSeconds = elapsedSeconds % 60;
    const duration = `${totalMinutes}m ${remainingSeconds}s`;

    const sleepTime = new Date(startTimeRef.current + elapsedSeconds * 1000);
    const sleepOnsetTime = sleepTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (storySessionId) {
      try {
        await api.updateStory(storySessionId, {
          endTime: new Date().toISOString(),
          duration: elapsedSeconds,
          sleepOnsetTime: new Date().toISOString(),
          completed: true,
          finalDriftScore: Math.round(driftScore),
          driftScoreHistory: driftHistory.map(s => Math.round(s)),
        });
        console.log('✓ Story session completed');

        await api.createSleepSession({
          childId: profile.childId,
          bedtime: new Date(startTimeRef.current).toISOString(),
          timeToSleep: Math.floor(elapsedSeconds / 60),
          quality: driftScore >= 85 ? 'excellent' : driftScore >= 70 ? 'good' : 'fair',
          nightWakings: 0,
          sleepEfficiency: Math.min(95, 70 + (driftScore - 50) / 2),
          storySessionId: storySessionId,
        });
        console.log('✓ Sleep session created');
      } catch (error) {
        console.error('Failed to save session data:', error);
      }
    }

    const summary: StorySummary = {
      title: storyTitle,
      duration,
      sleepOnsetTime,
      driftCurve: driftHistory,
      childId: profile.childId,
    };

    setTimeout(() => {
      onComplete(summary);
    }, 2000);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{
        backgroundColor: '#d4c4a7',
        backgroundImage: backgroundImage 
          ? `linear-gradient(rgba(228, 213, 183, 0.7), rgba(228, 213, 183, 0.8)), url(${backgroundImage})`
          : 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: backgroundImage ? 'cover' : '400px 400px',
        backgroundPosition: 'center',
        transition: 'background-image 1.5s ease-in-out',
      }}
    >
      {/* Parchment overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(90, 70, 50, 0.06) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(80, 60, 40, 0.04) 0%, transparent 40%),
            linear-gradient(180deg, 
              rgba(244, 232, 208, 0.3) 0%, 
              rgba(235, 224, 203, 0.2) 50%,
              rgba(244, 232, 208, 0.3) 100%
            )
          `
        }}
      />

      <div 
        className="flex-none backdrop-blur-sm px-6 py-4 relative z-10"
        style={{
          borderBottom: '1px solid rgba(40, 30, 20, 0.2)',
          background: 'rgba(244, 232, 208, 0.3)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://raw.githubusercontent.com/DzhanybekZakiriiaev/logo/refs/heads/main/logo.png" 
              alt="StoryDrift" 
              className="w-10 opacity-90"
              style={{ filter: 'sepia(0.1) contrast(1.1)' }}
            />
            <div>
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.85)', margin: 0 }}>
                {storyTitle}
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)', margin: 0 }}>
                journey in progress...
              </p>
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.85)' }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)' }}>
              drift: {Math.round(driftScore)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 relative flex flex-col" style={{ minHeight: 0 }}>
        <div className="mb-8 relative z-10">
          <DriftMeter score={driftScore} />
        </div>

        <div className="flex-1"></div>

        <div className="mt-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-5 mb-4"
            style={{
              background: 'rgba(250, 245, 235, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <p style={{ 
              fontFamily: "'Patrick Hand', cursive", 
              fontSize: '19px', 
              color: 'rgba(20, 15, 10, 0.85)', 
              textAlign: 'center', 
              lineHeight: '1.7',
              margin: 0 
            }}>
              {currentParagraph || 'preparing your magical tale...'}
            </p>
          </motion.div>

          <div className="flex justify-center pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className="px-8 py-4 flex items-center gap-3 transition-all cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '19px',
                color: 'rgba(20, 15, 10, 0.8)',
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.3)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                borderRadius: '50px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 250, 240, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(250, 245, 235, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.3)';
              }}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>resume</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
