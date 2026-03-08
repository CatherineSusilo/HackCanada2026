import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Smile } from 'lucide-react';
import { useApi } from '../../lib/api';
import type { Child } from '@prisma/client';

interface BehavioralStatsProps {
  onBack: () => void;
}

export function BehavioralStats({ onBack }: BehavioralStatsProps) {
  const api = useApi();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadStats(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const data = await api.getChildren();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (childId: string) => {
    try {
      const [storyStats, sleepStats, insights] = await Promise.all([
        api.getStoryStats(childId, 30),
        api.getSleepStats(childId, 30),
        api.getInsights(childId),
      ]);
      setStats({ story: storyStats, sleep: sleepStats, insights });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="size-full flex items-center justify-center"
        style={{
          backgroundColor: '#e4d5b7',
          backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
          backgroundSize: '400px 400px',
        }}
      >
        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.7)' }}>
          gathering insights...
        </p>
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
      </div>
    );
  }

  return (
    <div 
      className="size-full overflow-y-auto p-8 pl-24"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 transition-all cursor-pointer"
            style={{
              background: 'rgba(250, 245, 235, 0.8)',
              border: '1px solid rgba(40, 30, 20, 0.25)',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
            }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'rgba(20, 15, 10, 0.8)' }} />
          </button>
          
          <h1 
            style={{ 
              fontFamily: "'Indie Flower', cursive", 
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'rgba(20, 15, 10, 0.9)' 
            }}
          >
            behavioral insights
          </h1>
        </div>

        {/* Child Selector */}
        <div className="flex gap-3 mb-8">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className="px-5 py-3 transition-all cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                fontWeight: selectedChild?.id === child.id ? 'bold' : 'normal',
                color: selectedChild?.id === child.id ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.7)',
                background: selectedChild?.id === child.id ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                border: selectedChild?.id === child.id ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
              }}
            >
              {child.name}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Average Engagement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
              >
                <TrendingUp className="w-8 h-8 mb-3" style={{ color: 'rgba(80, 100, 60, 0.7)' }} />
                <h3 
                  className="mb-2"
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '17px',
                    color: 'rgba(30, 20, 15, 0.7)' 
                  }}
                >
                  avg engagement
                </h3>
                <p 
                  style={{ 
                    fontFamily: "'Indie Flower', cursive",
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.9)' 
                  }}
                >
                  {stats.insights?.avgEngagement || '87%'}
                </p>
              </motion.div>

              {/* Favorite Themes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Smile className="w-8 h-8 mb-3" style={{ color: 'rgba(180, 100, 80, 0.7)' }} />
                <h3 
                  className="mb-2"
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '17px',
                    color: 'rgba(30, 20, 15, 0.7)' 
                  }}
                >
                  favorite themes
                </h3>
                <p 
                  style={{ 
                    fontFamily: "'Indie Flower', cursive",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.9)',
                    lineHeight: '1.3',
                  }}
                >
                  {stats.insights?.favoriteThemes?.join(', ') || 'forest, ocean'}
                </p>
              </motion.div>

              {/* Learning Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span className="text-4xl mb-3 block">📚</span>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '17px',
                    color: 'rgba(30, 20, 15, 0.7)' 
                  }}
                >
                  learning insights
                </h3>
                <p 
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '16px',
                    color: 'rgba(20, 15, 10, 0.8)',
                    lineHeight: '1.4',
                  }}
                >
                  {stats.insights?.learningInsight || 'loves imaginative worlds, responds well to adventure'}
                </p>
              </motion.div>

              {/* Favorite Characters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.8)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span className="text-4xl mb-3 block">🌟</span>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '17px',
                    color: 'rgba(30, 20, 15, 0.7)' 
                  }}
                >
                  favorite characters
                </h3>
                <p 
                  style={{ 
                    fontFamily: "'Indie Flower', cursive",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'rgba(20, 15, 10, 0.9)',
                    lineHeight: '1.3',
                  }}
                >
                  {stats.insights?.favoriteCharacters?.join(', ') || 'friendly dragons, wise owls'}
                </p>
              </motion.div>
            </div>

            {/* Learning Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 relative"
              style={{
                background: 'rgba(250, 245, 235, 0.8)',
                border: '2px solid rgba(40, 30, 20, 0.25)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3 
                className="mb-8 text-center"
                style={{ 
                  fontFamily: "'Indie Flower', cursive",
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'rgba(20, 15, 10, 0.85)' 
                }}
              >
                {selectedChild.name}'s tale map
              </h3>
              <p 
                className="text-center mb-8"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '18px',
                  color: 'rgba(30, 20, 15, 0.65)' 
                }}
              >
                learning journey through stories
              </p>

              {/* Path with milestones */}
              <div className="relative max-w-3xl mx-auto">
                {/* Curved path SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <path
                    d="M 80 40 Q 200 60, 160 140 T 240 240 Q 180 300, 280 360 T 200 480"
                    stroke="rgba(80, 60, 40, 0.25)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="10,5"
                  />
                </svg>

                {/* Learning Milestones */}
                <div className="relative space-y-12 py-6">
                  {[
                    { icon: '🌱', label: 'first stories', desc: 'discovering narrative structure' },
                    { icon: '🌿', label: 'building vocabulary', desc: 'learning new words through tales' },
                    { icon: '🌳', label: 'emotional awareness', desc: 'understanding feelings & empathy' },
                    { icon: '🌟', label: 'imagination growth', desc: 'creating mental imagery' },
                    { icon: '✨', label: 'pattern recognition', desc: 'predicting story outcomes' },
                  ].map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`flex items-center gap-6 ${index % 2 === 0 ? 'ml-0 mr-auto' : 'ml-auto mr-0'}`}
                      style={{ maxWidth: '400px' }}
                    >
                      {/* Milestone Icon */}
                      <div 
                        className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl relative z-10"
                        style={{
                          background: 'rgba(210, 180, 140, 0.6)',
                          border: '3px solid rgba(40, 30, 20, 0.35)',
                          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
                        }}
                      >
                        {milestone.icon}
                      </div>

                      {/* Milestone Info */}
                      <div 
                        className="flex-1 p-4"
                        style={{
                          background: 'rgba(255, 250, 240, 0.7)',
                          border: '2px solid rgba(40, 30, 20, 0.2)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <p 
                          style={{ 
                            fontFamily: "'Indie Flower', cursive",
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: 'rgba(20, 15, 10, 0.85)',
                            marginBottom: '4px',
                          }}
                        >
                          {milestone.label}
                        </p>
                        <p 
                          style={{ 
                            fontFamily: "'Patrick Hand', cursive",
                            fontSize: '15px',
                            color: 'rgba(30, 20, 15, 0.7)' 
                          }}
                        >
                          {milestone.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
