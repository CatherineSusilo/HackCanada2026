import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Check, ArrowLeft, Play, Star } from 'lucide-react';
import { useApi } from '../../lib/api';
import { ROADMAP_THEMES } from '../data/roadmapThemes';

interface Child {
  id: string;
  name: string;
  age: number;
  preferences?: {
    storytellingTone: string;
    favoriteThemes?: string[];
  };
}

interface StoryRoadmapProps {
  child: Child;
  onBack: () => void;
  onStartStory: (storyConfig: any) => void;
}

const generateRoadmap = (age: number, completedStories: number) => {
  return ROADMAP_THEMES.map(node => ({
    ...node,
    unlocked: completedStories >= node.requiredStories,
    completed: completedStories >= node.requiredStories + node.totalStories,
    progress: Math.max(0, Math.min(node.totalStories, completedStories - node.requiredStories)),
  }));
};

export function StoryRoadmap({ child, onBack, onStartStory }: StoryRoadmapProps) {
  const api = useApi();
  const [storiesSessions, setStorySessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roadmapNodes, setRoadmapNodes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [child.id]);

  const loadData = async () => {
    try {
      const [stories, storyStats] = await Promise.all([
        api.getStories(child.id, 100, 0),
        api.getStoryStats(child.id, 30),
      ]);
      const sessions = stories.data || [];
      setStorySessions(sessions);
      setStats(storyStats);
      
      // Generate roadmap based on completed stories
      const completedCount = sessions.filter((s: any) => s.completed).length;
      const roadmap = generateRoadmap(child.age, completedCount);
      setRoadmapNodes(roadmap);
    } catch (error) {
      console.error('Failed to load story data:', error);
      // Fallback to default roadmap
      setRoadmapNodes(generateRoadmap(child.age, 0));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (node: any) => {
    if (!node.unlocked) return;
    
    onStartStory({
      childId: child.id,
      childName: child.name,
      childAge: child.age,
      theme: node.title,
      themeDescription: node.theme,
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
      <div className="sticky top-0 z-20 backdrop-blur-sm" style={{ 
        background: 'rgba(244, 232, 208, 0.85)',
        borderBottom: '2px solid rgba(40, 30, 20, 0.2)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="mb-5">
            <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '32px', color: 'rgba(20, 15, 10, 0.9)', margin: 0, letterSpacing: '0.5px' }}>
              {child.name}'s tale map
            </h2>
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', color: 'rgba(30, 20, 15, 0.65)', margin: 0 }}>
              choose tonight's path
            </p>
          </div>

          {/* Stats Bar */}
          {!loading && stats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-6 p-5 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(250, 245, 235, 0.8) 0%, rgba(245, 240, 230, 0.7) 100%)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
              }}
            >
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold' }}>
                  {stats.summary.totalSessions}
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.65)', fontWeight: 'bold' }}>
                  tales told
                </div>
              </div>
              <div style={{ width: '2px', background: 'linear-gradient(to bottom, transparent, rgba(40, 30, 20, 0.25), transparent)' }}></div>
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', color: 'rgba(20, 15, 10, 0.9)', fontWeight: 'bold' }}>
                  {Math.round(stats.summary.avgDuration / 60)}m
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.65)', fontWeight: 'bold' }}>
                  to slumber
                </div>
              </div>
              <div style={{ width: '2px', background: 'linear-gradient(to bottom, transparent, rgba(40, 30, 20, 0.25), transparent)' }}></div>
              <div className="flex-1 text-center">
                <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', color: 'rgba(60, 100, 60, 0.9)', fontWeight: 'bold' }}>
                  +{stats.summary.avgDriftImprovement}
                </div>
                <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.65)', fontWeight: 'bold' }}>
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
              d="M 50 0 Q 100 100, 50 200 T 50 400 Q 100 500, 50 600 T 50 800 Q 100 900, 50 1000"
              stroke="rgba(80, 60, 40, 0.2)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
            />
          </svg>

          <div className="relative space-y-8">
            {roadmapNodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                style={{ marginLeft: index % 2 === 0 ? '0' : 'auto', marginRight: index % 2 === 0 ? 'auto' : '0' }}
              >
                <button
                  onClick={() => handleSelectNode(node)}
                  disabled={!node.unlocked}
                  className={`relative group ${node.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {/* Main circle */}
                  <motion.div
                    whileHover={node.unlocked ? { scale: 1.1, y: -4 } : {}}
                    whileTap={node.unlocked ? { scale: 0.98 } : {}}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all relative"
                    style={{
                      background: node.unlocked 
                        ? node.completed 
                          ? 'linear-gradient(135deg, rgba(70, 130, 80, 1) 0%, rgba(50, 110, 60, 1) 100%)' 
                          : 'linear-gradient(135deg, rgba(230, 200, 160, 1) 0%, rgba(200, 170, 140, 1) 100%)' 
                        : 'linear-gradient(135deg, rgba(180, 160, 140, 0.6) 0%, rgba(160, 140, 120, 0.6) 100%)',
                      border: node.unlocked 
                        ? node.completed
                          ? '4px solid rgba(80, 140, 90, 1)'
                          : '4px solid rgba(60, 45, 30, 0.5)' 
                        : '4px solid rgba(40, 30, 20, 0.3)',
                      boxShadow: node.unlocked
                        ? '0 6px 16px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      filter: node.unlocked ? 'none' : 'grayscale(0.4) opacity(0.5)',
                    }}
                  >
                    {/* Pulsing glow for new unlocked nodes */}
                    {node.unlocked && !node.completed && node.progress === 0 && (
                      <motion.div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(255, 220, 100, 0.3) 0%, transparent 70%)',
                          filter: 'blur(8px)',
                        }}
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    
                    {node.unlocked ? (
                      <span style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15))' }}>{node.icon}</span>
                    ) : (
                      <Lock className="w-8 h-8" style={{ color: 'rgba(60, 50, 40, 0.5)' }} />
                    )}

                    {/* Progress ring */}
                    {node.unlocked && !node.completed && node.progress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="44"
                          stroke="rgba(70, 130, 80, 0.85)"
                          strokeWidth="5"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - node.progress / node.totalStories)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </motion.div>

                  {/* Checkmark for completed */}
                  {node.completed && (
                    <div 
                      className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(70, 180, 90, 1) 0%, rgba(50, 160, 70, 1) 100%)',
                        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
                      }}
                    >
                      <Check className="w-6 h-6" style={{ color: 'rgba(255, 255, 255, 1)' }} strokeWidth={3} />
                    </div>
                  )}

                  {/* Star/progress indicator */}
                  {node.unlocked && !node.completed && (
                    <div 
                      className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(50, 40, 30, 0.95) 0%, rgba(40, 30, 20, 0.95) 100%)',
                        border: '2px solid rgba(60, 45, 30, 0.6)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                      }}
                    >
                      <Star className="w-4 h-4 fill-current" style={{ color: 'rgba(255, 220, 100, 1)', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                      <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: 'rgba(255, 255, 255, 1)', fontWeight: 'bold' }}>
                        {node.progress}/{node.totalStories}
                      </span>
                    </div>
                  )}

                  {/* Node info card */}
                  <div className={`absolute ${index % 2 === 0 ? 'left-28' : 'right-28'} top-1/2 -translate-y-1/2 ${
                    node.unlocked ? 'opacity-100' : 'opacity-40'
                  }`}>
                    <div 
                      className="p-5 w-64 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(250, 245, 235, 0.98) 0%, rgba(245, 240, 230, 0.95) 100%)',
                        border: node.unlocked ? '3px solid rgba(60, 45, 30, 0.4)' : '2px solid rgba(40, 30, 20, 0.2)',
                        boxShadow: node.unlocked 
                          ? '0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5)' 
                          : '0 2px 6px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <p style={{ 
                        fontFamily: "'Indie Flower', cursive", 
                        fontSize: '22px', 
                        color: 'rgba(20, 15, 10, 0.9)', 
                        marginBottom: '4px',
                        fontWeight: 'bold'
                      }}>
                        {node.title}
                      </p>
                      <p style={{ 
                        fontFamily: "'Patrick Hand', cursive", 
                        fontSize: '14px', 
                        color: 'rgba(80, 60, 40, 0.8)', 
                        marginBottom: '8px', 
                        fontWeight: 'bold' 
                      }}>
                        {node.subtitle}
                      </p>
                      <p style={{ 
                        fontFamily: "'Patrick Hand', cursive", 
                        fontSize: '15px', 
                        color: 'rgba(30, 20, 15, 0.7)', 
                        margin: 0, 
                        lineHeight: '1.4' 
                      }}>
                        {node.description}
                      </p>
                    </div>
                  </div>

                  {/* Play button on hover */}
                  {node.unlocked && !node.completed && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(20, 15, 10, 0.4)' }}
                    >
                      <Play className="w-8 h-8 fill-current" style={{ color: 'rgba(255, 250, 240, 0.95)' }} />
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
          className="mt-12 p-6 text-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(250, 245, 235, 0.9) 0%, rgba(245, 240, 230, 0.85) 100%)',
            border: '3px solid rgba(60, 45, 30, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          }}
        >
          <p style={{ 
            fontFamily: "'Patrick Hand', cursive", 
            fontSize: '18px', 
            color: 'rgba(30, 20, 15, 0.85)', 
            lineHeight: '1.6', 
            margin: 0,
            fontWeight: 'bold'
          }}>
            ✨ complete stories to unlock more adventures! each bedtime tale you finish opens new magical worlds to explore ✨
          </p>
        </motion.div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
