import { useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import type { ChildProfile } from '../App';

interface SetupScreenProps {
  onStart: (profile: ChildProfile) => void;
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('6');
  const [favoriteAnimal, setFavoriteAnimal] = useState('');
  const [favoritePlace, setFavoritePlace] = useState('');
  const [initialState, setInitialState] = useState<'wound-up' | 'normal' | 'almost-there'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && favoriteAnimal && favoritePlace) {
      onStart({
        name,
        age: parseInt(age),
        favoriteAnimal,
        favoritePlace,
        initialState,
      });
    }
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
              <label className="block text-white mb-2">Favorite Animal</label>
              <input
                type="text"
                value={favoriteAnimal}
                onChange={(e) => setFavoriteAnimal(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Fox"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Favorite Place</label>
              <input
                type="text"
                value={favoritePlace}
                onChange={(e) => setFavoritePlace(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Forest"
                required
              />
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
