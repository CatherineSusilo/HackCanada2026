import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChildProfile, StorySummary } from '../App';
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
  const [currentText, setCurrentText] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [driftHistory, setDriftHistory] = useState<number[]>([0]);
  const [storySessionId, setStorySessionId] = useState<string | null>(null);
  const [storyDone, setStoryDone] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const imagePromptsRef = useRef<any[]>((window as any).storyImagePrompts || []);
  const startTimeRef = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedImagesRef = useRef<Map<number, string>>(new Map());
  const imageGenInProgressRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const score = calculateDriftScore(profile.initialState, 0);
    setDriftScore(score);
    setDriftHistory([score]);

    console.log('Image prompts available:', imagePromptsRef.current.length);

    // Save story session (fire-and-forget)
    if (profile.childId) {
      api.createStory({
        childId: profile.childId,
        storyTitle: 'Bedtime Story',
        storyContent: fullStory,
        parentPrompt: profile.parentPrompt,
        storytellingTone: profile.storytellingTone,
        initialState: profile.initialState,
        initialDriftScore: score,
        imagePrompts: imagePromptsRef.current,
        generatedImages: [],
        modelUsed: 'gemini-2.5-flash',
      }).then(s => setStorySessionId(s.id)).catch(e => console.warn('Session save failed:', e));
    }

    // Try ElevenLabs audio (fire-and-forget, story works without it)
    const voiceId = localStorage.getItem('ai_selected_voice');
    api.generateAudio(fullStory, voiceId || undefined)
      .then(blob => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play().catch(() => {});
        }
      })
      .catch(() => console.log('ElevenLabs unavailable, using browser TTS'));

    // Preload first image
    generateImageForIndex(0);

    const hintTimer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(hintTimer);
  }, []);

  const generateImageForIndex = async (paraIdx: number) => {
    const prompts = imagePromptsRef.current;
    if (prompts.length === 0 || imageGenInProgressRef.current.has(paraIdx)) return;

    const promptIdx = Math.min(
      Math.floor((paraIdx / Math.max(paragraphs.length, 1)) * prompts.length),
      prompts.length - 1
    );
    if (generatedImagesRef.current.has(promptIdx)) return;

    imageGenInProgressRef.current.add(paraIdx);
    try {
      const data = await api.generateImage(prompts[promptIdx].prompt);
      if (data?.imageUrl) {
        generatedImagesRef.current.set(promptIdx, data.imageUrl);
        const img = new Image();
        img.src = data.imageUrl;
        if (paraIdx <= currentParagraphIndex) {
          setBgImage(data.imageUrl);
        }
      }
    } catch (e) {
      console.warn('Image gen failed for paragraph', paraIdx);
    }
    imageGenInProgressRef.current.delete(paraIdx);
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || storyDone) return;
    const iv = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isPlaying, storyDone]);

  // Speak paragraphs via browser TTS (primary driver for timing)
  useEffect(() => {
    if (!isPlaying || currentParagraphIndex >= paragraphs.length || isSpeaking || storyDone) return;

    const text = paragraphs[currentParagraphIndex];
    setCurrentText(text);

    // Update background from cached images
    const prompts = imagePromptsRef.current;
    if (prompts.length > 0) {
      const promptIdx = Math.min(
        Math.floor((currentParagraphIndex / paragraphs.length) * prompts.length),
        prompts.length - 1
      );
      const cached = generatedImagesRef.current.get(promptIdx);
      if (cached) setBgImage(cached);

      // Preload next scene
      const nextPromptIdx = Math.min(
        Math.floor(((currentParagraphIndex + 1) / paragraphs.length) * prompts.length),
        prompts.length - 1
      );
      if (nextPromptIdx !== promptIdx) {
        generateImageForIndex(currentParagraphIndex + 1);
      }
    }

    const score = calculateDriftScore(profile.initialState, elapsedSeconds);
    setDriftScore(score);
    setDriftHistory(prev => [...prev, score]);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = Math.max(0.6, 1.0 - score / 200);
      utt.volume = audioRef.current ? 0 : Math.max(0.4, 1.0 - score / 150);
      utt.pitch = Math.max(0.8, 1.0 - score / 400);

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) utt.voice = voice;

      utt.onend = () => {
        setIsSpeaking(false);
        if (currentParagraphIndex >= paragraphs.length - 1 || score >= 90) {
          completeStory();
        } else {
          setCurrentParagraphIndex(p => p + 1);
        }
      };

      window.speechSynthesis.speak(utt);
    }
  }, [isPlaying, currentParagraphIndex, isSpeaking, storyDone]);

  const completeStory = async () => {
    setStoryDone(true);
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();

    const totalMin = Math.floor(elapsedSeconds / 60);
    const remSec = elapsedSeconds % 60;
    const duration = `${totalMin}m ${remSec}s`;
    const sleepTime = new Date(startTimeRef.current + elapsedSeconds * 1000);
    const sleepOnsetTime = sleepTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

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
      } catch (e) {
        console.warn('Failed to save final session:', e);
      }
    }

    setTimeout(() => {
      onComplete({ title: 'Bedtime Story', duration, sleepOnsetTime, driftCurve: driftHistory, childId: profile.childId });
    }, 3000);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
    if (isPlaying) window.speechSynthesis.pause();
    else window.speechSynthesis.resume();
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ userSelect: 'none' }}
      onClick={togglePlayPause}
    >
      {/* Base gradient (always visible) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 25%, #0d1b2a 50%, #1b2838 75%, #0a0a2e 100%)',
        }}
      />

      {/* AI-generated background image */}
      <AnimatePresence mode="sync">
        {bgImage && (
          <motion.div
            key={bgImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
      </AnimatePresence>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: bgImage ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)' }}
      />

      {/* Subtitle area */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-16 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentText}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="px-10 py-5"
            style={{
              background: 'rgba(0,0,0,0.65)',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '100%',
            }}
          >
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '32px',
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: '1.45',
                margin: 0,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {currentText || 'Loading your story...'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-5 w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, ((currentParagraphIndex + 1) / paragraphs.length) * 100)}%`,
              background: 'rgba(255,255,255,0.6)',
            }}
          />
        </div>
      </div>

      {/* Tap hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
              tap anywhere to pause
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused overlay */}
      <AnimatePresence>
        {!isPlaying && !storyDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}
              >
                <div style={{ width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderLeft: '24px solid rgba(255,255,255,0.8)', marginLeft: '4px' }} />
              </div>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '22px', color: 'rgba(255,255,255,0.7)' }}>
                tap to resume
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
