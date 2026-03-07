import { motion } from 'motion/react';

interface DriftMeterProps {
  score: number;
}

export function DriftMeter({ score }: DriftMeterProps) {
  const getPhaseInfo = (score: number) => {
    if (score < 25) {
      return {
        label: 'wound up',
        color: 'rgba(180, 120, 60, 0.6)',
        emoji: '⚡',
        description: 'full of energy',
      };
    } else if (score < 50) {
      return {
        label: 'settling',
        color: 'rgba(120, 140, 180, 0.6)',
        emoji: '🌤️',
        description: 'starting to relax',
      };
    } else if (score < 75) {
      return {
        label: 'drifting',
        color: 'rgba(140, 120, 180, 0.6)',
        emoji: '🌙',
        description: 'getting sleepy',
      };
    } else {
      return {
        label: 'almost gone',
        color: 'rgba(100, 80, 140, 0.7)',
        emoji: '😴',
        description: 'nearly asleep',
      };
    }
  };

  const phase = getPhaseInfo(score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '24px' }}>{phase.emoji}</span>
          <span style={{ fontFamily: "'Indie Flower', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.85)' }}>
            {phase.label}
          </span>
        </div>
        <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)' }}>
          {phase.description}
        </span>
      </div>

      <div 
        className="relative h-5 overflow-hidden"
        style={{
          background: 'rgba(250, 245, 235, 0.4)',
          border: '2px solid rgba(40, 30, 20, 0.3)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
        }}
      >
        <motion.div
          className="h-full"
          style={{
            background: phase.color,
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-sm font-bold drop-shadow-lg" 
            style={{ 
              color: 'rgba(20, 15, 10, 0.9)',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
              fontFamily: "'Patrick Hand', cursive",
            }}
          >
            {Math.round(score)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { range: '0-25', label: 'active', emoji: '⚡', min: 0, max: 25 },
          { range: '25-50', label: 'calm', emoji: '😊', min: 25, max: 50 },
          { range: '50-75', label: 'drowsy', emoji: '🌙', min: 50, max: 75 },
          { range: '75-100', label: 'sleep', emoji: '😴', min: 75, max: 100 },
        ].map((phase) => {
          const isActive = score >= phase.min && score < phase.max;
          return (
            <div 
              key={phase.range}
              className="text-center p-2.5 transition-all"
              style={{
                background: isActive ? 'rgba(210, 180, 140, 0.4)' : 'rgba(250, 245, 235, 0.3)',
                border: isActive ? '2px solid rgba(40, 30, 20, 0.4)' : '1px solid rgba(40, 30, 20, 0.2)',
                boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ 
                fontFamily: "'Patrick Hand', cursive", 
                fontSize: '14px', 
                color: 'rgba(20, 15, 10, 0.85)',
                fontWeight: isActive ? 'bold' : 'normal',
              }}>
                {phase.emoji} {phase.range}
              </div>
              <div style={{ 
                fontFamily: "'Patrick Hand', cursive", 
                fontSize: '11px', 
                color: 'rgba(30, 20, 15, 0.6)',
              }}>
                {phase.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
