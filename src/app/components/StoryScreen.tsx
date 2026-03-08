import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, X, Info } from 'lucide-react';
import type { ChildProfile, StorySummary } from '../App';
import { DriftMeter } from './DriftMeter';
import VitalsMonitor from './VitalsMonitor';
import { generateStorySegment } from '../utils/storyGenerator';
import { calculateDriftScore } from '../utils/driftCalculator';
import { useApi } from '../../lib/api';
import { StoryInteraction, type InteractionData } from './StoryInteraction';

interface StoryScreenProps {
  profile: ChildProfile;
  onComplete: (summary: StorySummary) => void;
  onExit?: () => void;
}

export function StoryScreen({ profile, onComplete, onExit }: StoryScreenProps) {
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
  const [vitalsConnected, setVitalsConnected] = useState(false);
  const [vitalsSleepiness, setVitalsSleepiness] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [storySessionId, setStorySessionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [exitPinError, setExitPinError] = useState(false);
  const PARENT_PIN = localStorage.getItem('parent_pin') || '1234';
  const [activeInteraction, setActiveInteraction] = useState<InteractionData | null>(null);
  const [interactionAnnounced, setInteractionAnnounced] = useState(false);
  const [interactionsState, setInteractionsState] = useState<InteractionData[]>(
    (profile.interactions || []) as InteractionData[]
  );
  const completedInteractionsRef = useRef<Set<string>>(new Set());
  const [insertedBridgeTexts, setInsertedBridgeTexts] = useState<Map<number, string>>(new Map());

  const imagePromptsRef = useRef<any[]>((window as any).storyImagePrompts || []);
  const startTimeRef = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedImagesRef = useRef<Map<number, string>>(new Map());
  const imageGenInProgressRef = useRef<Set<number>>(new Set());

  const storyTitle = 'Bedtime Story';
  const backgroundImage = bgImage;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVitalsUpdate = (sleepiness: number, isAsleep: boolean) => {
    setVitalsConnected(true);
    setVitalsSleepiness(sleepiness);
    
    // If vitals show child is asleep, boost drift score
    if (isAsleep) {
      const boostedScore = Math.min(100, driftScore + 20);
      setDriftScore(boostedScore);
      setDriftHistory((prev) => [...prev, boostedScore]);
    }
  };

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
        interactions: interactionsState,
        modelUsed: 'gemini-2.5-flash',
      }).then(s => setStorySessionId(s.id)).catch(e => console.warn('Session save failed:', e));
    }

    // Preload first image
    generateImageForIndex(0);

    const hintTimer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(hintTimer);
  }, []);

  const generateImageForIndex = async (paraIdx: number) => {
    const prompts = imagePromptsRef.current;
    console.log(`🖼️ generateImageForIndex(${paraIdx}): ${prompts.length} prompts available`);
    if (prompts.length === 0 || imageGenInProgressRef.current.has(paraIdx)) return;

    const promptIdx = Math.min(
      Math.floor((paraIdx / Math.max(paragraphs.length, 1)) * prompts.length),
      prompts.length - 1
    );
    if (generatedImagesRef.current.has(promptIdx)) return;

    imageGenInProgressRef.current.add(paraIdx);
    try {
      console.log(`🖼️ Requesting image for prompt ${promptIdx}:`, prompts[promptIdx]?.prompt?.substring(0, 80));
      const data = await api.generateImage(prompts[promptIdx].prompt);
      console.log(`🖼️ Image response:`, data?.imageUrl ? 'got URL' : 'no URL', data);
      if (data?.imageUrl) {
        generatedImagesRef.current.set(promptIdx, data.imageUrl);
        const img = new Image();
        img.src = data.imageUrl;
        if (paraIdx <= currentParagraphIndex) {
          setBgImage(data.imageUrl);
        }
      }
    } catch (e) {
      console.error('🖼️ Image gen failed for paragraph', paraIdx, e);
    }
    imageGenInProgressRef.current.delete(paraIdx);
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || storyDone) return;
    const iv = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isPlaying, storyDone]);

  // Speak paragraph using ElevenLabs
  const speakParagraph = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);

    // Calculate drift score, optionally boosted by vitals data
    let newScore = calculateDriftScore(profile.initialState, elapsedSeconds);
    
    // If vitals are connected, blend the scores
    if (vitalsConnected) {
      const vitalsScore = vitalsSleepiness * 100;
      newScore = (newScore * 0.6) + (vitalsScore * 0.4); // 60% time-based, 40% vitals-based
    }
    
    setDriftScore(newScore);
    setDriftHistory((prev) => [...prev, newScore]);

    try {
      // Voice mapping for different storytelling tones
      const DEFAULT_VOICE = 'dBeBf4ifazyJTIRH3VQh';
      const voiceMap: Record<string, string> = {
        calming: DEFAULT_VOICE,
        energetic: DEFAULT_VOICE,
        sad: DEFAULT_VOICE,
        adventurous: DEFAULT_VOICE,
        none: DEFAULT_VOICE,
      };

      const voiceId = voiceMap[profile.storytellingTone] || localStorage.getItem('ai_selected_voice') || DEFAULT_VOICE;

      const blob = await api.generateAudio(text, voiceId);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setIsSpeaking(false);
        if (currentParagraphIndex >= paragraphs.length - 1 || newScore >= 90) {
          completeStory();
        } else {
          advanceOrInteract(currentParagraphIndex + 1);
        }
      };

      audio.onerror = () => {
        console.error('Audio playback failed');
        setIsSpeaking(false);
        if (currentParagraphIndex < paragraphs.length - 1) {
          advanceOrInteract(currentParagraphIndex + 1);
        }
      };

      audio.play();

    } catch (error) {
      console.warn('ElevenLabs failed, falling back to Web Speech API:', error);
      speakWithBrowserTTS(text, newScore);
    }
  };

  const speakWithBrowserTTS = (text: string, newScore: number) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick a soft voice matching the storytelling tone
    const voices = synth.getVoices();
    const toneRateMap: Record<string, number> = {
      calming: 0.85,
      energetic: 1.0,
      sad: 0.8,
      adventurous: 0.95,
      none: 0.85,
    };
    utterance.rate = toneRateMap[profile.storytellingTone] || 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a female English voice for bedtime stories
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha'))
      || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setIsSpeaking(false);
      if (currentParagraphIndex >= paragraphs.length - 1 || newScore >= 90) {
        completeStory();
      } else {
        advanceOrInteract(currentParagraphIndex + 1);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (currentParagraphIndex < paragraphs.length - 1) {
        advanceOrInteract(currentParagraphIndex + 1);
      }
    };

    synth.speak(utterance);
  };

  const announceAndShowInteraction = async (interaction: InteractionData) => {
    setIsPlaying(false);
    setActiveInteraction(interaction);
    setInteractionAnnounced(false);
    setCurrentText(interaction.prompt);

    // Generate a new background image for the interaction scene
    if (interaction.imagePrompt) {
      api.generateImage(interaction.imagePrompt).then((data: any) => {
        if (data?.imageUrl) setBgImage(data.imageUrl);
      }).catch(() => {});
    }

    // Announce the prompt via TTS, then reveal the buttons
    try {
      const DEFAULT_VOICE = 'dBeBf4ifazyJTIRH3VQh';
      const voiceId = localStorage.getItem('ai_selected_voice') || DEFAULT_VOICE;
      const blob = await api.generateAudio(interaction.prompt, voiceId);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setInteractionAnnounced(true);
      audio.onerror = () => setInteractionAnnounced(true);
      audio.play();
    } catch {
      setInteractionAnnounced(true);
    }
  };

  const advanceOrInteract = (nextParaIndex: number) => {
    const pending = interactionsState.find(
      (i) => i.paragraphIndex === nextParaIndex && !completedInteractionsRef.current.has(i.id)
    );
    if (pending) {
      announceAndShowInteraction(pending);
    } else {
      setCurrentParagraphIndex(nextParaIndex);
    }
  };

  const handleInteractionResponse = async (interactionId: string, response: any) => {
    const interaction = interactionsState.find((i) => i.id === interactionId);
    if (!interaction) return;

    completedInteractionsRef.current.add(interactionId);

    const updated = interactionsState.map((i) =>
      i.id === interactionId ? { ...i, response } : i
    );
    setInteractionsState(updated);

    if (storySessionId) {
      api.saveInteraction(storySessionId, interactionId, response).catch((e: any) =>
        console.warn('Failed to save interaction:', e)
      );
    }

    setActiveInteraction(null);
    setInteractionAnnounced(false);

    if (interaction.type === 'choice' && response.bridgeText) {
      const bridgeIdx = interaction.paragraphIndex;
      setInsertedBridgeTexts((prev) => new Map(prev).set(bridgeIdx, response.bridgeText));
      setCurrentText(response.bridgeText);
      setIsSpeaking(true);

      try {
        const DEFAULT_VOICE = 'dBeBf4ifazyJTIRH3VQh';
        const voiceId = localStorage.getItem('ai_selected_voice') || DEFAULT_VOICE;
        const blob = await api.generateAudio(response.bridgeText, voiceId);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          setIsSpeaking(false);
          setIsPlaying(true);
          setCurrentParagraphIndex(interaction.paragraphIndex);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsPlaying(true);
          setCurrentParagraphIndex(interaction.paragraphIndex);
        };
        audio.play();
      } catch {
        setIsSpeaking(false);
        setIsPlaying(true);
        setCurrentParagraphIndex(interaction.paragraphIndex);
      }
    } else {
      setIsPlaying(true);
      setCurrentParagraphIndex(interaction.paragraphIndex);
    }
  };

  // Trigger paragraph playback
  useEffect(() => {
    if (!isPlaying || currentParagraphIndex >= paragraphs.length || isSpeaking || storyDone) return;
    if (activeInteraction) return;

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

    // Speak the paragraph using ElevenLabs
    speakParagraph(text);
  }, [isPlaying, currentParagraphIndex, isSpeaking, storyDone, activeInteraction]);

  const completeStory = async () => {
    setStoryDone(true);
    setIsPlaying(false);

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
          driftScoreHistory: driftHistory.map((s: number) => Math.round(s)),
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
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Info button - fixed position top right */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full border border-white/20 transition-all flex items-center justify-center shadow-lg"
      >
        {isPanelOpen ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      </button>

      {/* Collapsible info panel */}
      {isPanelOpen && (
        <div className="fixed top-20 right-4 z-40 w-80 bg-black/70 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl overflow-hidden animate-in slide-in-from-top-5">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-6 h-6 text-indigo-300" />

              {/* Vitals Monitor */}
              <div className="pt-3 border-t border-white/10">
                <VitalsMonitor onVitalsUpdate={handleVitalsUpdate} />
              </div>
              <div>
                <h2 className="text-white font-semibold">{storyTitle}</h2>
                <p className="text-indigo-300 text-sm">{profile.name}'s bedtime story</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-indigo-300 text-sm">Time Elapsed</span>
                <span className="text-white font-medium">{formatTime(elapsedSeconds)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-indigo-300 text-sm">Drift Score</span>
                <span className="text-white font-medium">{Math.round(driftScore)}</span>
              </div>

              <div className="pt-3 border-t border-white/10">
                <DriftMeter score={driftScore} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area with background */}
      <div 
        className="flex-1 p-6 relative flex flex-col min-h-screen"
        style={{
          backgroundImage: backgroundImage ? `linear-gradient(rgba(15, 13, 38, 0.4), rgba(15, 13, 38, 0.5)), url(${backgroundImage})` : 'linear-gradient(rgb(15 13 38), rgb(15 13 38))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 1s ease-in-out'
        }}
      >
        {/* Spacer to push content to bottom */}
        <div className="flex-1"></div>

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

      {/* Interactive learning overlay */}
      <AnimatePresence>
        {activeInteraction && (
          <StoryInteraction
            interaction={activeInteraction}
            childAge={profile.age}
            announced={interactionAnnounced}
            onRespond={handleInteractionResponse}
          />
        )}
      </AnimatePresence>

      {/* Paused overlay */}
      <AnimatePresence>
        {!isPlaying && !storyDone && !activeInteraction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => { if (!showExitPrompt) { setIsPlaying(true); } }}
          >
            {!showExitPrompt ? (
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

                {onExit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExitPrompt(true); }}
                    className="mt-8 px-5 py-2 cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                    }}
                  >
                    🔒 parent exit
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="p-6 text-center"
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: '16px',
                  border: '2px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  minWidth: '280px',
                }}
              >
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                  enter parent PIN
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={exitPin}
                  onChange={(e) => { setExitPin(e.target.value); setExitPinError(false); }}
                  autoFocus
                  className="w-full px-4 py-3 text-center mb-3"
                  placeholder="••••"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '28px',
                    letterSpacing: '8px',
                    color: '#ffffff',
                    background: 'rgba(255,255,255,0.1)',
                    border: exitPinError ? '2px solid rgba(255,100,100,0.6)' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (exitPin === PARENT_PIN) {
                        onExit?.();
                      } else {
                        setExitPinError(true);
                        setExitPin('');
                      }
                    }
                  }}
                />
                {exitPinError && (
                  <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(255,100,100,0.8)', marginBottom: '8px' }}>
                    wrong pin, try again
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-3">
                  <button
                    onClick={() => {
                      if (exitPin === PARENT_PIN) {
                        onExit?.();
                      } else {
                        setExitPinError(true);
                        setExitPin('');
                      }
                    }}
                    className="px-5 py-2 cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '17px',
                      color: '#ffffff',
                      background: 'rgba(130,100,255,0.4)',
                      border: '1px solid rgba(180,160,255,0.4)',
                      borderRadius: '8px',
                    }}
                  >
                    exit
                  </button>
                  <button
                    onClick={() => { setShowExitPrompt(false); setExitPin(''); setExitPinError(false); }}
                    className="px-5 py-2 cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '17px',
                      color: 'rgba(255,255,255,0.6)',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                    }}
                  >
                    cancel
                  </button>
                </div>
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '12px' }}>
                  default PIN: 1234
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
      </div>
    </div>
  );
}
