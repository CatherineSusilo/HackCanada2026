import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Loader2, ArrowLeft, ArrowRight, Check, Users, Music } from 'lucide-react';
import type { ChildProfile, StoryCharacter } from '../App';
import { useApi } from '../../lib/api';
import { DEFAULT_STORY_THEMES } from '../data/storyThemes';

interface SetupScreenProps {
  onStart: (profile: ChildProfile) => void;
  onBack?: () => void;
  onVoiceSettings?: () => void;
  onNavigate?: (view: string) => void;
  prefilledConfig: {
    childId: string;
    childName: string;
    childAge: number;
    theme: string;
    themeDescription: string;
  };
}

export function SetupScreen({ onStart, onBack, onVoiceSettings, onNavigate, prefilledConfig }: SetupScreenProps) {
  const api = useApi();
  const [currentStep, setCurrentStep] = useState(0);
  const [storytellingTone, setStorytellingTone] = useState<'calming' | 'energetic' | 'sad' | 'adventurous' | 'none'>('calming');
  const [parentPrompt, setParentPrompt] = useState(`${prefilledConfig.theme}: ${prefilledConfig.themeDescription}`);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [initialState, setInitialState] = useState<'wound-up' | 'normal' | 'almost-there'>('normal');
  const [interactionFrequency, setInteractionFrequency] = useState<'none' | 'every' | 'every3' | 'every5'>('every5');
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', icon: '📖' });
  const [savingTheme, setSavingTheme] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<StoryCharacter[]>([]);
  const [backgroundMusic, setBackgroundMusic] = useState(false);

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const [allThemes, setAllThemes] = useState(DEFAULT_STORY_THEMES.map(t => ({ ...t, id: String(t.id) })));

  useEffect(() => {
    api.getThemes().then((custom: any[]) => {
      const merged = [
        ...DEFAULT_STORY_THEMES.map(t => ({ id: String(t.id), name: t.name, description: t.description, icon: t.icon })),
        ...custom.map((t: any) => ({ id: t.id, name: t.name, description: t.description, icon: t.icon })),
      ];
      setAllThemes(merged);
    }).catch(() => {});

    const stored = localStorage.getItem(`drawings_${prefilledConfig.childId}`);
    if (stored) setSavedDrawings(JSON.parse(stored));

    api.getCharacters().then((chars: any[]) => setAllCharacters(chars)).catch(() => {});
  }, []);

  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) return;
    setSavingTheme(true);
    try {
      const created = await api.createTheme(newTheme);
      setAllThemes(prev => [...prev, { id: created.id, name: created.name, description: created.description, icon: created.icon }]);
      setParentPrompt(`${created.name}: ${created.description}`);
      setNewTheme({ name: '', description: '', icon: '📖' });
      setShowInlineCreate(false);
    } catch { }
    setSavingTheme(false);
  };

  const handleSubmit = async () => {
    if (!parentPrompt) return;
    setIsGenerating(true);
    setError(null);

    try {
      const profile: ChildProfile = {
        childId: prefilledConfig.childId,
        name: prefilledConfig.childName,
        age: prefilledConfig.childAge,
        storytellingTone,
        parentPrompt,
        uploadedImages,
        initialState,
        interactionFrequency,
        storyLength,
        characters: selectedCharacters,
        backgroundMusic,
      };

      const data = await api.generateStory(profile);
      (window as any).storyImagePrompts = data.imagePrompts || [];

      onStart({
        ...profile,
        generatedStory: data.story,
        interactions: data.interactions || [],
        characterVoices: data.characterVoices || [],
        characterIds: data.characterIds || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedImages([...uploadedImages, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    } else {
      onBack?.();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className="text-center mb-8">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '34px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.2' }}>
                how is {prefilledConfig.childName} feeling?
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', marginTop: '8px' }}>
                we'll match the story's energy
              </p>
            </div>
            <div className="space-y-3">
              {([
                { value: 'wound-up' as const, label: 'wound up - full of energy', emoji: '⚡', color: 'rgba(200, 120, 60, 0.2)' },
                { value: 'normal' as const, label: 'normal - ready for a story', emoji: '😊', color: 'rgba(120, 140, 200, 0.2)' },
                { value: 'almost-there' as const, label: 'almost there - very sleepy', emoji: '😴', color: 'rgba(140, 120, 180, 0.2)' },
              ]).map((option) => {
                const isSelected = initialState === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInitialState(option.value)}
                    className="w-full px-5 py-4 text-left transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      fontWeight: 'bold',
                      color: isSelected ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                      background: isSelected ? option.color : 'rgba(250, 245, 235, 0.3)',
                      border: isSelected ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.25)',
                      boxShadow: isSelected ? '0 3px 8px rgba(0, 0, 0, 0.15)' : '0 2px 5px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '28px' }}>{option.emoji}</span>
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-5 h-5 ml-auto" style={{ color: 'rgba(60, 100, 60, 0.8)' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className="text-center mb-8">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '34px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.2' }}>
                set the mood
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', marginTop: '8px' }}>
                choose a storytelling tone
              </p>
            </div>
            <div className="space-y-3">
              {([
                { value: 'calming' as const, label: 'calming', emoji: '🌙' },
                { value: 'energetic' as const, label: 'energetic', emoji: '⚡' },
                { value: 'sad' as const, label: 'gentle', emoji: '💙' },
                { value: 'adventurous' as const, label: 'adventurous', emoji: '✨' },
                { value: 'none' as const, label: 'neutral', emoji: '➖' },
              ]).map((option) => {
                const isSelected = storytellingTone === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStorytellingTone(option.value)}
                    className="w-full px-5 py-4 text-left transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      fontWeight: 'bold',
                      color: isSelected ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                      background: isSelected ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                      border: isSelected ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.25)',
                      boxShadow: isSelected ? '0 3px 8px rgba(0, 0, 0, 0.15)' : '0 2px 5px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '28px' }}>{option.emoji}</span>
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-5 h-5 ml-auto" style={{ color: 'rgba(60, 100, 60, 0.8)' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '34px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.2' }}>
                tonight's tale
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', marginTop: '8px' }}>
                pick a theme or write your own
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {allThemes.map((theme) => {
                const themePrompt = `${theme.name}: ${theme.description}`;
                const isSelected = parentPrompt === themePrompt;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setParentPrompt(themePrompt)}
                    className="px-4 py-3 text-left transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '16px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.8)',
                      background: isSelected ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                      border: isSelected ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.2)',
                      boxShadow: isSelected ? '0 3px 8px rgba(0, 0, 0, 0.12)' : '0 1px 4px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <span className="mr-1">{theme.icon}</span>
                    {theme.name}
                    <div style={{ fontSize: '13px', color: 'rgba(60, 45, 30, 0.6)', marginTop: '2px' }}>{theme.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Inline create + manage link */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setShowInlineCreate(!showInlineCreate)}
                className="flex-1 px-3 py-2 text-center transition-all cursor-pointer"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', fontWeight: 'bold', color: 'rgba(60, 80, 60, 0.85)', background: 'rgba(100, 150, 100, 0.12)', border: '1px dashed rgba(60, 80, 60, 0.4)' }}
              >
                + new theme
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('themes')}
                  className="px-3 py-2 text-center transition-all cursor-pointer"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.6)', background: 'rgba(250, 245, 235, 0.3)', border: '1px solid rgba(40, 30, 20, 0.2)' }}
                >
                  manage themes
                </button>
              )}
            </div>

            {showInlineCreate && (
              <div className="mb-4 p-4" style={{ background: 'rgba(250, 245, 235, 0.5)', border: '1px solid rgba(40, 30, 20, 0.2)' }}>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newTheme.icon}
                    onChange={(e) => setNewTheme({ ...newTheme, icon: e.target.value })}
                    className="w-14 px-2 py-2 text-center"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(40, 30, 20, 0.2)', outline: 'none' }}
                  />
                  <input
                    value={newTheme.name}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    placeholder="theme name"
                    className="flex-1 px-3 py-2"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(40, 30, 20, 0.2)', outline: 'none' }}
                  />
                </div>
                <input
                  value={newTheme.description}
                  onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                  placeholder="short description"
                  className="w-full px-3 py-2 mb-2"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(40, 30, 20, 0.2)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleCreateTheme}
                  disabled={savingTheme || !newTheme.name.trim()}
                  className="px-4 py-2 cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', fontWeight: 'bold', color: 'rgba(20, 15, 10, 0.85)', background: 'rgba(210, 180, 140, 0.5)', border: '1px solid rgba(40, 30, 20, 0.35)' }}
                >
                  {savingTheme ? 'saving...' : 'save & use'}
                </button>
              </div>
            )}

            <textarea
              value={parentPrompt}
              onChange={(e) => setParentPrompt(e.target.value)}
              className="w-full px-4 py-3 transition-all min-h-[80px] resize-none"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                color: 'rgba(15, 10, 5, 0.9)',
                background: 'rgba(255, 250, 240, 0.5)',
                border: '1px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
              }}
              placeholder="or describe your own tale..."
            />
          </>
        );

      case 3:
        return (
          <>
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '34px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.2' }}>
                who's in the story?
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', marginTop: '8px' }}>
                pick characters & story length
              </p>
            </div>

            {/* Story length */}
            <div className="mb-6">
              <label className="block mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}>
                story length
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'short' as const, label: '5-7 min', icon: '⏱️' },
                  { value: 'medium' as const, label: '10-15 min', icon: '⏲️' },
                  { value: 'long' as const, label: '15-20 min', icon: '⏰' },
                ]).map(opt => {
                  const isSel = storyLength === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStoryLength(opt.value)}
                      className="px-3 py-3 transition-all cursor-pointer text-center"
                      style={{
                        fontFamily: "'Patrick Hand', cursive", fontSize: '16px',
                        fontWeight: isSel ? 'bold' : 'normal',
                        color: isSel ? 'rgba(20, 15, 10, 0.9)' : 'rgba(40, 30, 20, 0.7)',
                        background: isSel ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                        border: isSel ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.2)',
                      }}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div style={{ fontSize: '14px' }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Characters */}
            <div>
              <label className="block mb-3 flex items-center gap-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}>
                <Users className="w-5 h-5" /> characters (optional)
              </label>
              {allCharacters.length === 0 ? (
                <div className="p-4 text-center" style={{ background: 'rgba(250, 245, 235, 0.3)', border: '1px dashed rgba(40, 30, 20, 0.2)' }}>
                  <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.5)' }}>
                    no characters yet
                  </p>
                  {onNavigate && (
                    <button type="button" onClick={() => onNavigate('characters')} className="mt-2 px-3 py-1.5 cursor-pointer" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(60, 80, 60, 0.8)', background: 'rgba(100, 150, 100, 0.12)', border: '1px solid rgba(60, 80, 60, 0.3)' }}>
                      create characters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {allCharacters.map(c => {
                      const isSel = selectedCharacters.some(sc => sc.id === c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              setSelectedCharacters(selectedCharacters.filter(sc => sc.id !== c.id));
                            } else {
                              setSelectedCharacters([...selectedCharacters, { id: c.id, name: c.name, description: c.description, personality: c.personality, icon: c.icon, voiceId: c.voiceId }]);
                            }
                          }}
                          className="px-3 py-2.5 text-left transition-all cursor-pointer flex items-center gap-2"
                          style={{
                            fontFamily: "'Patrick Hand', cursive", fontSize: '15px',
                            fontWeight: isSel ? 'bold' : 'normal',
                            color: isSel ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.7)',
                            background: isSel ? 'rgba(140, 120, 180, 0.2)' : 'rgba(250, 245, 235, 0.3)',
                            border: isSel ? '2px solid rgba(100, 80, 140, 0.5)' : '1px solid rgba(40, 30, 20, 0.2)',
                          }}
                        >
                          <span style={{ fontSize: '22px' }}>{c.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{c.name}</div>
                            <div className="truncate" style={{ fontSize: '12px', color: 'rgba(40, 30, 20, 0.45)' }}>{c.description}</div>
                          </div>
                          {isSel && <Check className="w-4 h-4 shrink-0" style={{ color: 'rgba(80, 60, 140, 0.7)' }} />}
                        </button>
                      );
                    })}
                  </div>
                  {onNavigate && (
                    <button type="button" onClick={() => onNavigate('characters')} className="text-sm cursor-pointer" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(40, 30, 20, 0.5)' }}>
                      manage characters
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        );

      case 4:
        return (
          <>
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '34px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.2' }}>
                extras
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', marginTop: '8px' }}>
                interactive moments & drawings
              </p>
            </div>

            <div className="mb-6">
              <label className="block mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}>
                interactive learning moments
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'none' as const, label: 'none', icon: '➖' },
                  { value: 'every5' as const, label: 'every 5th', icon: '🧩' },
                  { value: 'every3' as const, label: 'every 3rd', icon: '✨' },
                  { value: 'every' as const, label: 'every paragraph', icon: '🌟' },
                ]).map((option) => {
                  const isSelected = interactionFrequency === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setInteractionFrequency(option.value)}
                      className="px-3 py-3 transition-all cursor-pointer text-center"
                      style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '16px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: isSelected ? 'rgba(20, 15, 10, 0.9)' : 'rgba(40, 30, 20, 0.7)',
                        background: isSelected ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                        border: isSelected ? '2px solid rgba(40, 30, 20, 0.5)' : '1px solid rgba(40, 30, 20, 0.2)',
                        boxShadow: isSelected ? '0 3px 8px rgba(0, 0, 0, 0.12)' : '0 1px 4px rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <div style={{ fontSize: '14px' }}>{option.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-3 flex items-center gap-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}>
                <Music className="w-5 h-5" /> background music
              </label>
              <button
                type="button"
                onClick={() => setBackgroundMusic(!backgroundMusic)}
                className="w-full px-5 py-4 text-left transition-all cursor-pointer flex items-center gap-3"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  fontWeight: backgroundMusic ? 'bold' : 'normal',
                  color: backgroundMusic ? 'rgba(20, 15, 10, 0.9)' : 'rgba(40, 30, 20, 0.65)',
                  background: backgroundMusic ? 'rgba(140, 120, 180, 0.2)' : 'rgba(250, 245, 235, 0.3)',
                  border: backgroundMusic ? '2px solid rgba(100, 80, 140, 0.5)' : '1px solid rgba(40, 30, 20, 0.2)',
                }}
              >
                <span style={{ fontSize: '24px' }}>{backgroundMusic ? '🎵' : '🔇'}</span>
                <div>
                  <div>{backgroundMusic ? 'ambient music on' : 'no background music'}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(40, 30, 20, 0.45)' }}>
                    ai-generated ambient sounds matching the story theme
                  </div>
                </div>
                {backgroundMusic && <Check className="w-5 h-5 ml-auto shrink-0" style={{ color: 'rgba(80, 60, 140, 0.7)' }} />}
              </button>
            </div>

            <div>
              <label className="block mb-3" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}>
                child's drawings (optional)
              </label>
              {savedDrawings.length > 0 && (
                <>
                  <p className="mb-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(40, 30, 20, 0.55)' }}>
                    tap to select from saved drawings
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {savedDrawings.map((d: any) => {
                      const isSelected = uploadedImages.some((f: any) => f._drawingId === d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setUploadedImages(uploadedImages.filter((f: any) => f._drawingId !== d.id));
                            } else {
                              const fake = new File([], d.name) as any;
                              fake._drawingId = d.id;
                              fake._drawingUrl = d.url;
                              setUploadedImages([...uploadedImages, fake]);
                            }
                          }}
                          className="transition-all cursor-pointer"
                          style={{
                            border: isSelected ? '3px solid rgba(60, 100, 60, 0.7)' : '2px solid rgba(40, 30, 20, 0.2)',
                            boxShadow: isSelected ? '0 2px 8px rgba(60, 100, 60, 0.3)' : 'none',
                            padding: '2px',
                          }}
                        >
                          <img src={d.url} alt={d.name} className="w-full h-16 object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <label
                  className="flex-1 px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '16px',
                    color: 'rgba(30, 20, 15, 0.8)',
                    background: 'rgba(250, 245, 235, 0.3)',
                    border: '2px dashed rgba(60, 45, 30, 0.3)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span style={{ fontWeight: 'bold' }}>upload new</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('drawings')}
                    className="px-4 py-3 transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '16px',
                      color: 'rgba(40, 30, 20, 0.7)',
                      background: 'rgba(250, 245, 235, 0.3)',
                      border: '1px solid rgba(40, 30, 20, 0.2)',
                    }}
                  >
                    manage drawings
                  </button>
                )}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="size-full overflow-y-auto flex items-center justify-center p-6"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(90, 70, 50, 0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(80, 60, 40, 0.06) 0%, transparent 40%),
            linear-gradient(180deg, rgba(244, 232, 208, 0.5) 0%, rgba(235, 224, 203, 0.3) 50%, rgba(244, 232, 208, 0.5) 100%)
          `,
        }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', color: 'rgba(30, 20, 15, 0.6)' }}>
            crafting a story for <strong>{prefilledConfig.childName}</strong>, age {prefilledConfig.childAge}
          </p>
          <div
            className="inline-block mt-2 px-4 py-1.5"
            style={{
              fontFamily: "'Indie Flower', cursive",
              fontSize: '20px',
              color: 'rgba(20, 15, 10, 0.85)',
              fontWeight: 'bold',
              background: 'rgba(230, 210, 180, 0.5)',
              border: '2px solid rgba(60, 45, 30, 0.25)',
            }}
          >
            {prefilledConfig.theme}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 overflow-hidden" style={{ background: 'rgba(250, 245, 235, 0.4)', border: '1px solid rgba(40, 30, 20, 0.25)' }}>
            <motion.div
              className="h-full"
              style={{ background: 'rgba(80, 100, 60, 0.6)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.5)', marginTop: '6px', textAlign: 'center' }}>
            step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8"
            style={{
              background: 'rgba(250, 245, 235, 0.9)',
              border: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            }}
          >
            {renderStep()}

            {error && (
              <div
                className="mt-4 p-4"
                style={{
                  background: 'rgba(180, 60, 60, 0.1)',
                  border: '2px solid rgba(139, 0, 0, 0.3)',
                  color: 'rgba(90, 40, 30, 0.9)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 transition-all cursor-pointer flex items-center gap-2"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'rgba(25, 20, 15, 0.75)',
                  background: 'rgba(250, 245, 235, 0.35)',
                  border: '1px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>back</span>
              </button>

              {currentStep < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.85)',
                    background: 'rgba(60, 50, 40, 0.08)',
                    border: '1px solid rgba(30, 20, 15, 0.3)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <span>continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isGenerating || !parentPrompt}
                  className="flex-1 py-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "'Indie Flower', cursive",
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'rgba(250, 245, 240, 0.98)',
                    background: 'linear-gradient(135deg, rgba(140, 100, 60, 0.85) 0%, rgba(120, 85, 50, 0.9) 100%)',
                    border: '3px solid rgba(160, 120, 80, 0.6)',
                    boxShadow: '0 6px 20px rgba(100, 70, 40, 0.35)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>weaving tale...</span>
                    </>
                  ) : (
                    <span>begin bedtime story</span>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
