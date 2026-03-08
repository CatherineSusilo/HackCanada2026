import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Users, BookOpen, Image,
  BarChart3, Settings, Palette, ChevronRight, Drama 
} from 'lucide-react';

export type SidebarView = 
  | 'dashboard' 
  | 'statistics' 
  | 'archive' 
  | 'drawings' 
  | 'themes'
  | 'characters'
  | 'ai-settings';

interface SidebarProps {
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

const menuItems = [
  { id: 'dashboard' as SidebarView, icon: Users, label: 'children' },
  { id: 'statistics' as SidebarView, icon: BarChart3, label: 'behavioral insights' },
  { id: 'archive' as SidebarView, icon: BookOpen, label: 'story archive' },
  { id: 'drawings' as SidebarView, icon: Image, label: 'drawings' },
  { id: 'themes' as SidebarView, icon: Palette, label: 'story themes' },
  { id: 'characters' as SidebarView, icon: Drama, label: 'characters' },
  { id: 'ai-settings' as SidebarView, icon: Settings, label: 'ai settings' },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 p-3 cursor-pointer transition-all"
        style={{
          background: 'rgba(250, 245, 235, 0.95)',
          border: '2px solid rgba(40, 30, 20, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" style={{ color: 'rgba(20, 15, 10, 0.8)' }} />
        ) : (
          <Menu className="w-6 h-6" style={{ color: 'rgba(20, 15, 10, 0.8)' }} />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(20, 15, 10, 0.4)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-40 w-80 p-6 pt-24"
            style={{
              background: 'rgba(228, 213, 183, 0.98)',
              backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
              backgroundSize: '400px 400px',
              borderRight: '2px solid rgba(40, 30, 20, 0.3)',
              boxShadow: '4px 0 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 
                className="text-center mb-2"
                style={{ 
                  fontFamily: "'Indie Flower', cursive", 
                  fontSize: '28px', 
                  color: 'rgba(20, 15, 10, 0.85)',
                  fontWeight: 'bold',
                }}
              >
                dream book
              </h2>
              <div 
                className="h-px mx-8"
                style={{ background: 'rgba(40, 30, 20, 0.2)' }}
              />
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3.5 flex items-center gap-3 transition-all cursor-pointer group"
                    style={{
                      fontFamily: "'Patrick Hand', cursive",
                      fontSize: '19px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? 'rgba(20, 15, 10, 0.9)' : 'rgba(30, 20, 15, 0.75)',
                      background: isActive ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.2)',
                      border: isActive ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.15)',
                      boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.06)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(240, 230, 210, 0.4)';
                        e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(250, 245, 235, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.15)';
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(40, 30, 20, 0.5)' }} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div 
              className="absolute bottom-6 left-6 right-6 pt-6"
              style={{ borderTop: '1px solid rgba(40, 30, 20, 0.2)' }}
            >
              <p 
                className="text-center text-sm"
                style={{ 
                  fontFamily: "'Patrick Hand', cursive", 
                  fontSize: '14px',
                  color: 'rgba(40, 30, 20, 0.5)' 
                }}
              >
                where dreams are woven
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </>
  );
}
