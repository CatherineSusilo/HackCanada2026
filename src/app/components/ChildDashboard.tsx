import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'motion/react';
import { Plus, LogOut, Baby } from 'lucide-react';
import { useApi } from '../../lib/api';

interface Child {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  preferences?: {
    storytellingTone: string;
    favoriteThemes: string[];
  };
}

interface ChildDashboardProps {
  onSelectChild: (child: Child) => void;
  onAddChild: () => void;
}

export function ChildDashboard({ onSelectChild, onAddChild }: ChildDashboardProps) {
  const { user, logout } = useAuth0();
  const api = useApi();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const data = await api.getChildren();
      setChildren(data);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
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
        <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.7)' }}>
          gathering your little ones...
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://raw.githubusercontent.com/DzhanybekZakiriiaev/logo/refs/heads/main/logo.png" 
              alt="StoryDrift" 
              className="w-12 opacity-90"
              style={{ filter: 'sepia(0.1) contrast(1.1)' }}
            />
            <div>
              <h1 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(20, 15, 10, 0.85)', margin: 0 }}>
                StoryDrift
              </h1>
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: 'rgba(30, 20, 15, 0.6)', margin: 0 }}>
                dream keeper's log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.picture && (
              <img 
                src={user.picture} 
                alt={user.name || ''} 
                className="w-10 h-10 rounded-full opacity-90"
                style={{ border: '2px solid rgba(40, 30, 20, 0.3)', filter: 'sepia(0.15)' }}
              />
            )}
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="cursor-pointer transition-all"
              style={{ color: 'rgba(30, 20, 15, 0.6)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(20, 15, 10, 0.85)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(30, 20, 15, 0.6)'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '36px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '8px' }}>
            welcome back, {user?.name?.split(' ')[0] || 'friend'}
          </h2>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)' }}>
            whose dreams shall we follow tonight?
          </p>
        </motion.div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {children.map((child, index) => (
              <motion.button
                key={child.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectChild(child)}
                className="relative p-6 backdrop-blur-sm transition-all group overflow-hidden cursor-pointer"
                style={{
                  background: 'rgba(250, 245, 235, 0.6)',
                  border: '2px solid rgba(40, 30, 20, 0.25)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="relative flex items-start gap-4">
                  {/* Avatar */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(210, 180, 140, 0.4)',
                      border: '2px solid rgba(40, 30, 20, 0.3)',
                    }}
                  >
                    {child.avatar ? (
                      <img src={child.avatar} alt={child.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Baby className="w-8 h-8" style={{ color: 'rgba(40, 30, 20, 0.6)' }} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '24px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '4px' }}>
                      {child.name}
                    </h3>
                    <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.6)' }}>
                      {child.age} years old
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="transition-colors" style={{ color: 'rgba(40, 30, 20, 0.4)' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Add Child Card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: children.length * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddChild}
              className="relative p-6 backdrop-blur-sm transition-all group h-full min-h-[120px] flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(250, 245, 235, 0.4)',
                border: '2px dashed rgba(40, 30, 20, 0.3)',
              }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: 'rgba(210, 180, 140, 0.3)',
                    border: '2px solid rgba(40, 30, 20, 0.2)',
                  }}
                >
                  <Plus className="w-8 h-8" style={{ color: 'rgba(40, 30, 20, 0.5)' }} />
                </div>
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(30, 20, 15, 0.7)', fontWeight: 'bold' }}>
                  add a child
                </p>
              </div>
            </motion.button>
        </div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6"
          style={{
            background: 'rgba(250, 245, 235, 0.6)',
            border: '1px solid rgba(40, 30, 20, 0.25)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '17px', color: 'rgba(30, 20, 15, 0.75)', lineHeight: '1.6', margin: 0, textAlign: 'center' }}>
            each night, storydrift learns the path to peaceful slumber. over thirty moons, patterns emerge, and dreams become easier to find.
          </p>
        </motion.div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
