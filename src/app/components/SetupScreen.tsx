import { useState } from 'react';
import { Upload, X, Loader2, ArrowLeft, Moon, Mic } from 'lucide-react';
import type { ChildProfile } from '../App';
import { useApi } from '../../lib/api';

interface SetupScreenProps {
  onStart: (profile: ChildProfile) => void;
  onBack?: () => void;
  onVoiceSettings?: () => void;
  prefilledConfig?: {
    childId: string;
    childName: string;
    childAge: number;
    theme: string;
    themeDescription: string;
  };
}

export function SetupScreen({ onStart, onBack, onVoiceSettings, prefilledConfig }: SetupScreenProps) {
  const api = useApi();
  const [name, setName] = useState(prefilledConfig?.childName || '');
  const [age, setAge] = useState(prefilledConfig?.childAge.toString() || '6');
  const [storytellingTone, setStorytellingTone] = useState<'calming' | 'energetic' | 'sad' | 'adventurous' | 'none'>('calming');
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [parentPrompt, setParentPrompt] = useState(prefilledConfig ? `${prefilledConfig.theme}: ${prefilledConfig.themeDescription}` : '');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [initialState, setInitialState] = useState<'wound-up' | 'normal' | 'almost-there'>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storyPrompts = [
    { emoji: '🏰', text: 'a princess and her magical castle' },
    { emoji: '🌲', text: 'an adventure through enchanted woods' },
    { emoji: '🚀', text: 'a journey to the stars and beyond' },
    { emoji: '🐉', text: 'a friendly dragon who loves bedtime' },
    { emoji: '🌊', text: 'underwater kingdom of mermaids' },
    { emoji: '🦄', text: 'unicorns in a rainbow meadow' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && parentPrompt) {
      setIsGenerating(true);
      setError(null);
      
      try {
        const profile: ChildProfile = {
          childId: prefilledConfig?.childId || '',
          name,
          age: parseInt(age),
          storytellingTone,
          parentPrompt,
          uploadedImages,
          initialState,
        };
        
        const data = await api.generateStory(profile);
        (window as any).storyImagePrompts = data.imagePrompts || [];
        
        onStart({
          ...profile,
          generatedStory: data.story,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate story. Please try again.');
        setIsGenerating(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedImages([...uploadedImages, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <div 
      className="min-h-full w-full flex items-center justify-center p-8 overflow-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(245, 230, 200, 1) 0%, rgba(240, 220, 185, 1) 50%, rgba(235, 215, 190, 1) 100%)',
      }}
    >
      <div className="w-full max-w-2xl my-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Moon className="w-12 h-12" style={{ color: 'rgba(140, 110, 70, 0.8)' }} />
            <h1 
              className="text-5xl"
              style={{ 
                fontFamily: "'Indie Flower', cursive",
                color: 'rgba(60, 45, 30, 0.9)',
                textShadow: '0 2px 8px rgba(200, 170, 130, 0.4)'
              }}
            >
              StoryDrift
            </h1>
          </div>
          <p 
            className="text-xl"
            style={{ 
              fontFamily: "'Patrick Hand', cursive",
              color: 'rgba(80, 60, 40, 0.8)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
            }}
          >
            The story that knows when your child is asleep
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="p-10 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(250, 245, 235, 0.98) 0%, rgba(245, 240, 230, 0.95) 100%)',
            border: '3px solid rgba(60, 45, 30, 0.35)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
          }}
        >
          {prefilledConfig && (
            <div 
              className="mb-8 pb-6 border-b"
              style={{ borderColor: 'rgba(60, 45, 30, 0.25)' }}
            >
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', color: 'rgba(40, 30, 20, 0.65)', marginBottom: '6px' }}>
                crafting a story for
              </p>
              <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '32px', color: 'rgba(20, 15, 10, 0.9)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                {prefilledConfig.childName}, age {prefilledConfig.childAge}
              </h3>
              <div 
                className="mt-5 p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(230, 210, 180, 0.5) 0%, rgba(220, 200, 170, 0.4) 100%)',
                  border: '3px solid rgba(60, 45, 30, 0.3)',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                }}
              >
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(50, 40, 30, 0.7)', marginBottom: '4px', fontWeight: 'bold' }}>
                  Tonight's adventure:
                </p>
                <p style={{ fontFamily: "'Indie Flower', cursive", fontSize: '24px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold', lineHeight: '1.3' }}>
                  {prefilledConfig.theme}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-7">
            {!prefilledConfig && (
              <>
                <div>
                  <label 
                    className="block mb-3"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                  >
                    child's name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-lg transition-all"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      color: 'rgba(15, 10, 5, 0.95)',
                      background: 'rgba(255, 250, 245, 0.7)',
                      border: '2px solid rgba(60, 45, 30, 0.25)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                    }}
                    placeholder="their given name"
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block mb-3"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                  >
                    age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-5 py-4 rounded-lg transition-all"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      color: 'rgba(15, 10, 5, 0.95)',
                      background: 'rgba(255, 250, 245, 0.7)',
                      border: '2px solid rgba(60, 45, 30, 0.25)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                    }}
                    min="3"
                    max="12"
                    required
                  />
                </div>
              </>
            )}

            {!prefilledConfig && (
              <>
                <div>
                  <label 
                    className="block mb-3"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                  >
                    storytelling tone
                  </label>
                  <select
                    value={storytellingTone}
                    onChange={(e) => setStorytellingTone(e.target.value as any)}
                    className="w-full px-5 py-4 rounded-lg transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      color: 'rgba(15, 10, 5, 0.95)',
                      background: 'rgba(255, 250, 245, 0.7)',
                      border: '2px solid rgba(60, 45, 30, 0.25)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                    }}
                    required
                  >
                    <option value="calming">🌙 calming</option>
                    <option value="energetic">⚡ energetic</option>
                    <option value="sad">💙 gentle</option>
                    <option value="adventurous">✨ adventurous</option>
                    <option value="none">➖ neutral</option>
                  </select>
                </div>

                <div>
                  <label 
                    className="block mb-3"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                  >
                    story length
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'short', label: '5-7 min', icon: '⏱️' },
                      { value: 'medium', label: '10-15 min', icon: '⏲️' },
                      { value: 'long', label: '15-20 min', icon: '⏰' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStoryLength(option.value as any)}
                        className="px-4 py-4 rounded-xl transition-all cursor-pointer text-center"
                        style={{
                          fontFamily: "'Patrick Hand', cursive",
                          fontSize: '17px',
                          color: storyLength === option.value ? 'rgba(20, 15, 10, 0.9)' : 'rgba(40, 30, 20, 0.7)',
                          background: storyLength === option.value 
                            ? 'linear-gradient(135deg, rgba(200, 180, 160, 0.4) 0%, rgba(190, 170, 150, 0.3) 100%)' 
                            : 'rgba(255, 250, 245, 0.5)',
                          border: storyLength === option.value ? '3px solid rgba(60, 45, 30, 0.5)' : '2px solid rgba(60, 45, 30, 0.2)',
                          boxShadow: storyLength === option.value 
                            ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
                            : '0 2px 6px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!prefilledConfig && (
              <div>
                <label 
                  className="block mb-3"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
                >
                  story theme
                </label>
                
                {/* Quick prompts */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {storyPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setParentPrompt(prompt.text)}
                      className="px-4 py-3 rounded-xl transition-all cursor-pointer text-left"
                      style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '16px',
                        color: 'rgba(30, 20, 15, 0.8)',
                        background: 'rgba(255, 250, 245, 0.6)',
                        border: '2px solid rgba(60, 45, 30, 0.2)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(230, 210, 190, 0.4) 0%, rgba(220, 200, 180, 0.3) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 250, 245, 0.6)';
                        e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.2)';
                      }}
                    >
                      <span className="mr-1">{prompt.emoji}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>

                <textarea
                  value={parentPrompt}
                  onChange={(e) => setParentPrompt(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl transition-all min-h-[120px] resize-y"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '19px',
                    color: 'rgba(15, 10, 5, 0.95)',
                    background: 'rgba(255, 250, 245, 0.7)',
                    border: '2px solid rgba(60, 45, 30, 0.25)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                  }}
                  placeholder="describe the tale you seek... (e.g., 'a journey through enchanted woods')"
                  required
                />
              </div>
            )}

            <div>
              <label 
                className="block mb-3"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
              >
                child's drawings (optional)
              </label>
              <div className="space-y-4">
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-28 object-cover rounded-xl"
                          style={{ 
                            border: '3px solid rgba(60, 45, 30, 0.3)',
                            filter: 'sepia(0.15)',
                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ background: 'rgba(139, 0, 0, 0.9)', color: 'white', boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label 
                  className="w-full px-5 py-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '19px',
                    color: 'rgba(30, 20, 15, 0.8)',
                    background: 'rgba(255, 250, 245, 0.5)',
                    border: '2px dashed rgba(60, 45, 30, 0.35)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 252, 248, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 250, 245, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.35)';
                  }}
                >
                  <Upload className="w-6 h-6" />
                  <span style={{ fontWeight: 'bold' }}>{uploadedImages.length > 0 ? 'add more images' : 'choose images'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label 
                className="block mb-4"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.8)', fontWeight: 'bold' }}
              >
                how is {prefilledConfig?.childName || name || 'your child'} feeling tonight?
              </label>
              <div className="space-y-3">
                {[
                  { value: 'wound-up', label: '⚡ wound up - full of energy', color: 'rgba(200, 120, 60, 0.2)' },
                  { value: 'normal', label: '😊 normal - ready for a story', color: 'rgba(120, 140, 200, 0.2)' },
                  { value: 'almost-there', label: '😴 almost there - very sleepy', color: 'rgba(140, 120, 180, 0.2)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInitialState(option.value as any)}
                    className="w-full px-5 py-4 rounded-xl transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      color: initialState === option.value ? 'rgba(20, 15, 10, 0.9)' : 'rgba(40, 30, 20, 0.75)',
                      background: initialState === option.value ? option.color : 'rgba(255, 250, 245, 0.5)',
                      border: initialState === option.value ? '3px solid rgba(60, 45, 30, 0.5)' : '2px solid rgba(60, 45, 30, 0.2)',
                      boxShadow: initialState === option.value 
                        ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
                        : '0 2px 6px rgba(0, 0, 0, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      if (initialState !== option.value) {
                        e.currentTarget.style.background = 'rgba(255, 252, 248, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (initialState !== option.value) {
                        e.currentTarget.style.background = 'rgba(255, 250, 245, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.2)';
                      }
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div 
                className="p-5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(180, 60, 60, 0.12) 0%, rgba(160, 50, 50, 0.1) 100%)',
                  border: '2px solid rgba(139, 0, 0, 0.3)',
                  color: 'rgba(90, 40, 30, 0.9)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(139, 0, 0, 0.15)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full px-8 py-5 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              style={{
                fontFamily: "'Indie Flower', cursive",
                fontSize: '26px',
                color: 'rgba(250, 245, 240, 0.98)',
                background: 'linear-gradient(135deg, rgba(140, 100, 60, 0.85) 0%, rgba(120, 85, 50, 0.9) 100%)',
                border: '3px solid rgba(160, 120, 80, 0.6)',
                boxShadow: '0 6px 20px rgba(100, 70, 40, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(160, 115, 70, 0.9) 0%, rgba(135, 95, 60, 0.95) 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(100, 70, 40, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(140, 100, 60, 0.85) 0%, rgba(120, 85, 50, 0.9) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(100, 70, 40, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.2)';
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>weaving tale...</span>
                </>
              ) : (
                <span>✨ begin bedtime story ✨</span>
              )}
            </button>

            {onVoiceSettings && (
              <button
                type="button"
                onClick={onVoiceSettings}
                className="w-full px-6 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '19px',
                  color: 'rgba(50, 40, 30, 0.8)',
                  background: 'rgba(255, 250, 245, 0.5)',
                  border: '2px solid rgba(60, 45, 30, 0.25)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220, 200, 180, 0.4) 0%, rgba(210, 190, 170, 0.35) 100%)';
                  e.currentTarget.style.color = 'rgba(30, 20, 15, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 250, 245, 0.5)';
                  e.currentTarget.style.color = 'rgba(50, 40, 30, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(60, 45, 30, 0.25)';
                }}
              >
                <Mic className="w-6 h-6" />
                <span style={{ fontWeight: 'bold' }}>AI voice settings</span>
              </button>
            )}
          </div>
        </form>

        <p 
          className="text-center mt-8"
          style={{ 
            fontFamily: "'Patrick Hand', cursive", 
            fontSize: '17px', 
            color: 'rgba(100, 80, 60, 0.65)',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)'
          }}
        >
          ✨ tales crafted by ancient magic ✨
        </p>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
