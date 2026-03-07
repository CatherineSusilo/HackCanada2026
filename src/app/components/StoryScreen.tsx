import { useState, useEffect, useRef } from 'react';
import { Moon, Pause, Play } from 'lucide-react';
import type { ChildProfile, StorySummary } from '../App';
import { DriftMeter } from './DriftMeter';
import { generateStorySegment } from '../utils/storyGenerator';
import { calculateDriftScore } from '../utils/driftCalculator';

interface StoryScreenProps {
  profile: ChildProfile;
  onComplete: (summary: StorySummary) => void;
}

export function StoryScreen({ profile, onComplete }: StoryScreenProps) {
  const [driftScore, setDriftScore] = useState(0);
  const fullStory = profile.generatedStory || 'Once upon a time...';
  const paragraphs = fullStory.split('\n').filter(p => p.trim().length > 0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [storyTitle] = useState(
    `${profile.name}'s Bedtime Story`
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [driftHistory, setDriftHistory] = useState<number[]>([0]);

  const startTimeRef = useRef<number>(Date.now());
  const storyPhaseRef = useRef<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const initialScore = calculateDriftScore(profile.initialState, 0);
    setDriftScore(initialScore);
    setDriftHistory([initialScore]);
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
    
    // Set current paragraph (replaces previous)
    setCurrentParagraph(paragraph);
    
    // Speak the paragraph
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
        
        // Check if story is complete
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

  const completeStory = () => {
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

    const summary: StorySummary = {
      title: storyTitle,
      duration,
      sleepOnsetTime,
      driftCurve: driftHistory,
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
    <div className="size-full flex flex-col">
      <div className="flex-none bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-white">{storyTitle}</h2>
              <p className="text-indigo-300 text-sm">{profile.name}'s bedtime story</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white">{formatTime(elapsedSeconds)}</div>
            <div className="text-indigo-300 text-sm">Drift Score: {Math.round(driftScore)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 relative flex flex-col">
        <div className="mb-8">
          <DriftMeter score={driftScore} />
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>

        {/* Subtitle-style text at absolute bottom */}
        <div className="mt-auto">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20 shadow-2xl mb-4">
            <p className="text-white text-center text-sm leading-relaxed">
              {currentParagraph || 'Loading your story...'}
            </p>
          </div>

          <div className="flex justify-center pb-2">
            <button
              onClick={togglePlayPause}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
