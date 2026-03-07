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
  const [storyText, setStoryText] = useState(fullStory); // Show full story immediately
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSegment, setCurrentSegment] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [storyTitle] = useState(
    `${profile.name}'s Bedtime Story`
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [driftHistory, setDriftHistory] = useState<number[]>([0]);

  const storyWords = fullStory.split(' ');
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
    if (!isPlaying || currentWordIndex >= storyWords.length) return;

    const interval = setInterval(() => {
      const newScore = calculateDriftScore(profile.initialState, elapsedSeconds);
      setDriftScore(newScore);
      setDriftHistory((prev) => [...prev, newScore]);

      // Display words progressively based on drift score
      // Higher drift score = slower word reveal
      const wordsPerInterval = Math.max(1, Math.floor(5 - newScore / 25));
      const nextIndex = Math.min(currentWordIndex + wordsPerInterval, storyWords.length);
      const newWords = storyWords.slice(currentWordIndex, nextIndex).join(' ');
      
      setCurrentWordIndex(nextIndex);
      setStoryText((prev) => prev + (prev ? ' ' : '') + newWords);
      setCurrentSegment(newWords);

      // Speak the new segment
      if (newWords) {
        speakSegment(newWords, newScore);
      }

      storyPhaseRef.current += 1;

      // Complete when drift score is high or story is finished
      if (newScore >= 85 || nextIndex >= storyWords.length) {
        setTimeout(() => {
          completeStory();
        }, 5000);
      }
    }, 3000); // Reveal words every 3 seconds

    return () => clearInterval(interval);
  }, [isPlaying, elapsedSeconds, currentWordIndex, profile, storyWords]);

  const speakSegment = (text: string, score: number) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.6, 1.0 - score / 200);
      utterance.volume = Math.max(0.4, 1.0 - score / 150);
      utterance.pitch = Math.max(0.8, 1.0 - score / 400);

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) utterance.voice = voice;

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

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <DriftMeter score={driftScore} />
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="prose prose-invert max-w-none">
              <p className="text-indigo-100 leading-relaxed whitespace-pre-wrap">
                {storyText || 'Loading your story...'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
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
