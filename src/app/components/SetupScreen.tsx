import { useState } from 'react';
import { Moon, Sparkles, Upload, X } from 'lucide-react';
import type { ChildProfile } from '../App';

interface SetupScreenProps {
  onStart: (profile: ChildProfile) => void;
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('6');
  const [storytellingTone, setStorytellingTone] = useState<'calming' | 'energetic' | 'sad' | 'adventurous' | 'none'>('calming');
  const [parentPrompt, setParentPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [initialState, setInitialState] = useState<'wound-up' | 'normal' | 'almost-there'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && parentPrompt) {
      onStart({
        name,
        age: parseInt(age),
        storytellingTone,
        parentPrompt,
        uploadedImages,
        initialState,
      });
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
    <div className="size-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon className="w-10 h-10 text-indigo-300" />
            <h1 className="text-4xl text-white">StoryDrift</h1>
          </div>
          <p className="text-indigo-200">The story that knows when your child is asleep</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">Child's Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Emma"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                min="3"
                max="12"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Storytelling Tone</label>
              <select
                value={storytellingTone}
                onChange={(e) => setStorytellingTone(e.target.value as any)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              >
                <option value="calming" className="bg-indigo-900">Calming</option>
                <option value="energetic" className="bg-indigo-900">Energetic</option>
                <option value="sad" className="bg-indigo-900">Sad</option>
                <option value="adventurous" className="bg-indigo-900">Adventurous</option>
                <option value="none" className="bg-indigo-900">None (Neutral)</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Story Prompt (for parents)</label>
              <textarea
                value={parentPrompt}
                onChange={(e) => setParentPrompt(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[100px] resize-y"
                placeholder="Describe the story you'd like... (e.g., 'A journey through a magical forest with talking animals')"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Upload Child's Drawings (optional)</label>
              <div className="space-y-3">
                <label className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white/80 hover:bg-white/30 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span>Choose Images</span>
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
                          className="w-full h-20 object-cover rounded-lg border border-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <label className="block text-white mb-3">How is your child feeling tonight?</label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setInitialState('wound-up')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    initialState === 'wound-up'
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Wound Up - Full of energy</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialState('normal')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    initialState === 'normal'
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>Normal - Ready for a story</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialState('almost-there')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    initialState === 'almost-there'
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>Almost There - Very sleepy</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Begin Tonight's Story
            </button>
          </div>
        </form>

        <p className="text-center text-indigo-300/60 mt-6 text-sm">
          Demo mode - simulates real-time drift scoring
        </p>
      </div>
    </div>
  );
}
