import { motion } from 'motion/react';
import { Sparkles, Moon, CloudMoon } from 'lucide-react';

interface DriftMeterProps {
  score: number;
}

export function DriftMeter({ score }: DriftMeterProps) {
  const getPhaseInfo = (score: number) => {
    if (score < 25) {
      return {
        label: 'Wound Up',
        color: 'from-yellow-400 to-orange-500',
        icon: Sparkles,
        description: 'Full of energy',
      };
    } else if (score < 50) {
      return {
        label: 'Settling',
        color: 'from-blue-400 to-indigo-500',
        icon: CloudMoon,
        description: 'Starting to relax',
      };
    } else if (score < 75) {
      return {
        label: 'Drifting',
        color: 'from-indigo-500 to-purple-600',
        icon: Moon,
        description: 'Getting sleepy',
      };
    } else {
      return {
        label: 'Almost Gone',
        color: 'from-purple-700 to-indigo-900',
        icon: Moon,
        description: 'Nearly asleep',
      };
    }
  };

  const phase = getPhaseInfo(score);
  const Icon = phase.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-indigo-300" />
          <span>{phase.label}</span>
        </div>
        <span className="text-sm text-indigo-300">{phase.description}</span>
      </div>

      <div className="relative h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
        <motion.div
          className={`h-full bg-gradient-to-r ${phase.color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white mix-blend-difference">
            {Math.round(score)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className={`text-center p-2 rounded ${score >= 0 ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className="text-yellow-300">0-25</div>
          <div className="text-white/60">Active</div>
        </div>
        <div className={`text-center p-2 rounded ${score >= 25 ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className="text-blue-300">25-50</div>
          <div className="text-white/60">Calm</div>
        </div>
        <div className={`text-center p-2 rounded ${score >= 50 ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className="text-purple-300">50-75</div>
          <div className="text-white/60">Drowsy</div>
        </div>
        <div className={`text-center p-2 rounded ${score >= 75 ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className="text-indigo-300">75-100</div>
          <div className="text-white/60">Sleep</div>
        </div>
      </div>
    </div>
  );
}
