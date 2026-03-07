import { useState } from 'react';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import type { ChildProfile } from '../App';
import { useApi } from '../../lib/api';

interface SetupScreenProps {
  onStart: (profile: ChildProfile) => void;
  onBack?: () => void;
  prefilledConfig?: {
    childId: string;
    childName: string;
    childAge: number;
    theme: string;
    themeDescription: string;
  };
}

export function SetupScreen({ onStart, onBack, prefilledConfig }: SetupScreenProps) {
  const api = useApi();
  const [name, setName] = useState(prefilledConfig?.childName || '');
  const [age, setAge] = useState(prefilledConfig?.childAge.toString() || '6');
  const [storytellingTone, setStorytellingTone] = useState<'calming' | 'energetic' | 'sad' | 'adventurous' | 'none'>('calming');
  const [parentPrompt, setParentPrompt] = useState(prefilledConfig ? `${prefilledConfig.theme}: ${prefilledConfig.themeDescription}` : '');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [initialState, setInitialState] = useState<'wound-up' | 'normal' | 'almost-there'>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      className="size-full flex items-center justify-center p-6 overflow-y-auto"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Parchment overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(90, 70, 50, 0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(80, 60, 40, 0.06) 0%, transparent 40%),
            linear-gradient(180deg, 
              rgba(244, 232, 208, 0.5) 0%, 
              rgba(235, 224, 203, 0.3) 50%,
              rgba(244, 232, 208, 0.5) 100%
            )
          `
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 cursor-pointer transition-all"
            style={{ color: 'rgba(30, 20, 15, 0.6)', fontFamily: "'Patrick Hand', cursive", fontSize: '17px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(20, 15, 10, 0.85)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(30, 20, 15, 0.6)'}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>back to map</span>
          </button>
        )}

        <div className="text-center mb-6">
          <h1 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '38px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '8px' }}>
            customize story
          </h1>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)' }}>
            final details for {name}'s bedtime tale
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="p-8"
          style={{
            background: 'rgba(250, 245, 235, 0.8)',
            border: '2px solid rgba(40, 30, 20, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="space-y-5">
            {!prefilledConfig && (
              <>
                <div>
                  <label 
                    className="block mb-2"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
                  >
                    child's name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 transition-all"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '18px',
                      color: 'rgba(15, 10, 5, 0.9)',
                      background: 'rgba(255, 250, 240, 0.5)',
                      border: '1px solid rgba(40, 30, 20, 0.25)',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    }}
                    placeholder="their given name"
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block mb-2"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
                  >
                    age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 transition-all"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '18px',
                      color: 'rgba(15, 10, 5, 0.9)',
                      background: 'rgba(255, 250, 240, 0.5)',
                      border: '1px solid rgba(40, 30, 20, 0.25)',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    }}
                    min="3"
                    max="12"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label 
                className="block mb-2"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
              >
                storytelling tone
              </label>
              <select
                value={storytellingTone}
                onChange={(e) => setStorytellingTone(e.target.value as any)}
                className="w-full px-4 py-3 transition-all cursor-pointer"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  color: 'rgba(15, 10, 5, 0.9)',
                  background: 'rgba(255, 250, 240, 0.5)',
                  border: '1px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
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

            {!prefilledConfig && (
              <div>
                <label 
                  className="block mb-2"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
                >
                  story theme
                </label>
                <textarea
                  value={parentPrompt}
                  onChange={(e) => setParentPrompt(e.target.value)}
                  className="w-full px-4 py-3 transition-all min-h-[100px] resize-y"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '18px',
                    color: 'rgba(15, 10, 5, 0.9)',
                    background: 'rgba(255, 250, 240, 0.5)',
                    border: '1px solid rgba(40, 30, 20, 0.25)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                  }}
                  placeholder="describe the tale you seek... (e.g., 'a journey through enchanted woods')"
                  required
                />
              </div>
            )}

            <div>
              <label 
                className="block mb-2"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
              >
                child's drawings (optional)
              </label>
              <div className="space-y-3">
                <label 
                  className="w-full px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '18px',
                    color: 'rgba(25, 20, 15, 0.75)',
                    background: 'rgba(250, 245, 235, 0.35)',
                    border: '1px solid rgba(40, 30, 20, 0.25)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 250, 240, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(250, 245, 235, 0.35)';
                  }}
                >
                  <Upload className="w-5 h-5" />
                  <span>choose images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover"
                          style={{ 
                            border: '2px solid rgba(40, 30, 20, 0.3)',
                            filter: 'sepia(0.2)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ background: 'rgba(139, 0, 0, 0.8)', color: 'white' }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label 
                className="block mb-3"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '19px', color: 'rgba(20, 15, 10, 0.75)' }}
              >
                how is {name || 'your child'} feeling tonight?
              </label>
              <div className="space-y-3">
                {[
                  { value: 'wound-up', label: '⚡ wound up - full of energy', color: 'rgba(180, 100, 40, 0.15)' },
                  { value: 'normal', label: '😊 normal - ready for a story', color: 'rgba(100, 120, 180, 0.15)' },
                  { value: 'almost-there', label: '😴 almost there - very sleepy', color: 'rgba(120, 100, 160, 0.15)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInitialState(option.value as any)}
                    className="w-full px-4 py-3 transition-all cursor-pointer"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '18px',
                      color: initialState === option.value ? 'rgba(20, 15, 10, 0.85)' : 'rgba(30, 20, 15, 0.7)',
                      background: initialState === option.value ? option.color : 'rgba(250, 245, 235, 0.3)',
                      border: initialState === option.value ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                      boxShadow: initialState === option.value ? '0 3px 8px rgba(0, 0, 0, 0.12)' : '0 2px 5px rgba(0, 0, 0, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      if (initialState !== option.value) {
                        e.currentTarget.style.background = 'rgba(255, 250, 240, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (initialState !== option.value) {
                        e.currentTarget.style.background = 'rgba(250, 245, 235, 0.3)';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div 
                className="p-4 text-sm"
                style={{
                  background: 'rgba(139, 0, 0, 0.06)',
                  border: '1px solid rgba(139, 0, 0, 0.2)',
                  color: 'rgba(80, 40, 30, 0.8)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '16px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full px-6 py-4 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '22px',
                color: 'rgba(20, 15, 10, 0.8)',
                background: 'rgba(60, 50, 40, 0.08)',
                border: '1px solid rgba(30, 20, 15, 0.3)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.background = 'rgba(60, 50, 40, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(60, 50, 40, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.3)';
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
          </div>
        </form>

        <p 
          className="text-center mt-6 text-sm"
          style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.55)' }}
        >
          tales crafted by ancient magic
        </p>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
