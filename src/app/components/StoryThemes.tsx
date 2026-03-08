import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Plus } from 'lucide-react';

interface StoryThemesProps {
  onBack: () => void;
}

const defaultThemes = [
  { id: 1, name: 'enchanted forest', description: 'magical creatures and hidden paths', icon: '🌲' },
  { id: 2, name: 'ocean adventure', description: 'underwater worlds and friendly sea life', icon: '🌊' },
  { id: 3, name: 'space explorer', description: 'stars, planets, and cosmic journeys', icon: '✨' },
  { id: 4, name: 'cozy village', description: 'warm homes and kind neighbors', icon: '🏡' },
  { id: 5, name: 'friendly dragons', description: 'gentle dragons and castle tales', icon: '🐉' },
  { id: 6, name: 'bedtime circus', description: 'soft acrobats and sleepy performers', icon: '🎪' },
];

export function StoryThemes({ onBack }: StoryThemesProps) {
  const [themes, setThemes] = useState(defaultThemes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', icon: '📖' });

  const handleAddTheme = () => {
    if (!newTheme.name.trim()) return;
    
    setThemes([
      ...themes,
      {
        id: Date.now(),
        name: newTheme.name,
        description: newTheme.description,
        icon: newTheme.icon,
      },
    ]);
    
    setNewTheme({ name: '', description: '', icon: '📖' });
    setShowAddForm(false);
  };

  return (
    <div 
      className="size-full overflow-y-auto p-8 pl-24"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 
            style={{ 
              fontFamily: "'Indie Flower', cursive", 
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.9)' 
            }}
          >
            story themes
          </h1>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-3 flex items-center gap-2 transition-all cursor-pointer"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.85)',
              background: 'rgba(210, 180, 140, 0.4)',
              border: '2px solid rgba(40, 30, 20, 0.35)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Plus className="w-5 h-5" />
            add theme
          </button>
        </div>

        {/* Add Theme Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 mb-8"
            style={{
              background: 'rgba(250, 245, 235, 0.9)',
              border: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="theme name"
                value={newTheme.name}
                onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="emoji icon"
                value={newTheme.icon}
                onChange={(e) => setNewTheme({ ...newTheme, icon: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="short description"
                value={newTheme.description}
                onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                className="px-4 py-2 w-full"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '17px',
                  color: 'rgba(20, 15, 10, 0.9)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1.5px solid rgba(40, 30, 20, 0.3)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleAddTheme}
              className="px-6 py-2 cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'rgba(20, 15, 10, 0.85)',
                background: 'rgba(210, 180, 140, 0.5)',
                border: '2px solid rgba(40, 30, 20, 0.35)',
              }}
            >
              save theme
            </button>
          </motion.div>
        )}

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 transition-all cursor-pointer hover:scale-105"
              style={{
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-4xl mb-3">{theme.icon}</div>
              <h3 
                style={{ 
                  fontFamily: "'Indie Flower', cursive", 
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.9)',
                  marginBottom: '6px',
                }}
              >
                {theme.name}
              </h3>
              <p 
                style={{ 
                  fontFamily: "'Patrick Hand', cursive", 
                  fontSize: '16px',
                  color: 'rgba(30, 20, 15, 0.7)' 
                }}
              >
                {theme.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
