import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Check, ArrowLeft, Play } from 'lucide-react';
import { useApi } from '../../lib/api';

interface Child {
  id: string;
  name: string;
  age: number;
  preferences?: {
    storytellingTone: string;
  };
}

interface StoryRoadmapProps {
  child: Child;
  onBack: () => void;
  onStartStory: (storyConfig: any) => void;
}

const storyThemes = [
  { id: 1, title: 'The Enchanted Forest', description: 'Explore a magical woodland', icon: '🌲', unlocked: true },
  { id: 2, title: 'Ocean Dreamland', description: 'Dive into peaceful waters', icon: '🌊', unlocked: true },
  { id: 3, title: 'Starry Night Journey', description: 'Float among the stars', icon: '⭐', unlocked: true },
  { id: 4, title: 'The Cozy Castle', description: 'Find warmth and safety', icon: '🏰', unlocked: true },
  { id: 5, title: 'Garden of Dreams', description: 'Wander through flowers', icon: '🌸', unlocked: true },
  { id: 6, title: 'Mountain Lullaby', description: 'Climb to peaceful peaks', icon: '⛰️', unlocked: false },
  { id: 7, title: 'Desert Oasis', description: 'Rest under palm trees', icon: '🌴', unlocked: false },
  { id: 8, title: 'Northern Lights', description: 'Dance with the aurora', icon: '✨', unlocked: false },
];

export function StoryRoadmap({ child, onBack, onStartStory }: StoryRoadmapProps) {
  const api = useApi();
  const [storiesSessions, setStorySessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [child.id]);

  const loadData = async () => {
    try {
      const [stories, storyStats] = await Promise.all([
        api.getStories(child.id, 10, 0),
        api.getStoryStats(child.id, 30),
      ]);
      setStorySessions(stories.data || []);
      setStats(storyStats);
    } catch (error) {
      console.error('Failed to load story data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = (theme: any) => {
    if (!theme.unlocked) return;
    
    onStartStory({
      childId: child.id,
      childName: child.name,
      childAge: child.age,
      theme: theme.title,
      themeDescription: theme.description,
    });
  };

  return (
    <div 
      className="size-full overflow-y-auto"
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

      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-sm" style={{ borderBottom: '1px solid rgba(40, 30, 20, 0.15)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="cursor-pointer transition-all"
              style={{ color: 'rgba(30, 20, 15, 0.6)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(20, 15, 10, 0.85)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(30, 20, 15, 0.6)'}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(20, 15, 10, 0.85)', margin: 0 }}>
                {child.name}'s tale map
              </h2>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.6)', margin: 0 }}>
                choose tonight's path
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && stats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 p-4"
              style={{
                background: 'rgba(250, 245, 235, 0.6)',
                border: '1px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(20, 15, 10, 0.85)' }}>
                  {stats.summary.totalSessions}
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)' }}>
                  tales told
                </div>
              </div>
              <div style={{ width: '1px', background: 'rgba(40, 30, 20, 0.2)' }}></div>
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(20, 15, 10, 0.85)' }}>
                  {Math.round(stats.summary.avgDuration / 60)}m
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)' }}>
                  to slumber
                </div>
              </div>
              <div style={{ width: '1px', background: 'rgba(40, 30, 20, 0.2)' }}></div>
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(60, 100, 60, 0.85)' }}>
                  +{stats.summary.avgDriftImprovement}
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)' }}>
                  drift gain
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Story Path */}
      <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <div className="relative">
          {/* Curved path line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <path
              d="M 50 0 Q 100 100, 50 200 T 50 400 Q 100 500, 50 600 T 50 800"
              stroke="rgba(80, 60, 40, 0.2)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="8,4"
            />
          </svg>

          <div className="relative space-y-6">
            {storyThemes.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                style={{ marginLeft: index % 2 === 0 ? '0' : 'auto', marginRight: index % 2 === 0 ? 'auto' : '0' }}
              >
                <button
                  onClick={() => handleSelectTheme(theme)}
                  disabled={!theme.unlocked}
                  className={`relative group ${theme.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <motion.div
                    whileHover={theme.unlocked ? { scale: 1.08 } : {}}
                    whileTap={theme.unlocked ? { scale: 0.95 } : {}}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all"
                    style={{
                      background: theme.unlocked ? 'rgba(210, 180, 140, 0.5)' : 'rgba(180, 160, 130, 0.3)',
                      border: theme.unlocked ? '3px solid rgba(40, 30, 20, 0.4)' : '3px solid rgba(60, 50, 40, 0.2)',
                      filter: theme.unlocked ? 'none' : 'grayscale(1) opacity(0.6)',
                    }}
                  >
                    {theme.unlocked ? (
                      <span style={{ filter: 'sepia(0.3)' }}>{theme.icon}</span>
                    ) : (
                      <Lock className="w-6 h-6" style={{ color: 'rgba(60, 50, 40, 0.4)' }} />
                    )}
                  </motion.div>

                  {/* Checkmark for completed */}
                  {theme.unlocked && storiesSessions.some((s: any) => s.storyTitle.includes(theme.title.split(' ')[0])) && (
                    <div 
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(60, 100, 60, 0.8)', border: '2px solid rgba(20, 15, 10, 0.3)' }}
                    >
                      <Check className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }} strokeWidth={3} />
                    </div>
                  )}

                  {/* Theme info */}
                  <div className={`absolute ${index % 2 === 0 ? 'left-24' : 'right-24'} top-1/2 -translate-y-1/2 ${
                    theme.unlocked ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div 
                      className="p-3 shadow-lg w-48"
                      style={{
                        background: 'rgba(250, 245, 235, 0.95)',
                        border: '1px solid rgba(40, 30, 20, 0.3)',
                      }}
                    >
                      <p style={{ fontFamily: "'Indie Flower', cursive", fontSize: '18px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '4px' }}>
                        {theme.title}
                      </p>
                      <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)', margin: 0 }}>
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {/* Play button on hover */}
                  {theme.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="absolute inset-0 w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(20, 15, 10, 0.3)' }}
                    >
                      <Play className="w-6 h-6 fill-current" style={{ color: 'rgba(255, 250, 240, 0.9)' }} />
                    </motion.div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-6 text-center"
          style={{
            background: 'rgba(250, 245, 235, 0.6)',
            border: '1px solid rgba(40, 30, 20, 0.25)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', color: 'rgba(30, 20, 15, 0.75)', lineHeight: '1.6', margin: 0 }}>
            complete stories to unlock more adventures! each bedtime tale you finish opens new magical worlds to explore.
          </p>
        </motion.div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
