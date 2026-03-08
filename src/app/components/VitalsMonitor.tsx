import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';

interface VitalsData {
  pulseRate?: number;
  breathingRate?: number;
  signalQuality?: number;
  timestamp: string;
}

interface VitalsMonitorProps {
  onVitalsUpdate?: (sleepiness: number, isAsleep: boolean) => void;
}

export default function VitalsMonitor({ onVitalsUpdate }: VitalsMonitorProps) {
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Listen for vitals updates from iOS bridge
    const handleVitalsUpdate = (event: CustomEvent) => {
      const data = event.detail as VitalsData;
      setVitals(data);
      setIsConnected(true);

      // Calculate sleepiness and notify parent component
      if (onVitalsUpdate) {
        const sleepiness = calculateSleepiness(data);
        const isAsleep = checkIfAsleep(data);
        onVitalsUpdate(sleepiness, isAsleep);
      }
    };

    window.addEventListener('vitalsUpdate', handleVitalsUpdate as EventListener);

    // Start monitoring when component mounts
    if (window.storyDriftBridge) {
      window.storyDriftBridge.startMonitoring();
      setIsConnected(true);
    }

    return () => {
      window.removeEventListener('vitalsUpdate', handleVitalsUpdate as EventListener);
      // Stop monitoring when component unmounts
      if (window.storyDriftBridge) {
        window.storyDriftBridge.stopMonitoring();
      }
    };
  }, [onVitalsUpdate]);

  const calculateSleepiness = (data: VitalsData): number => {
    if (!data.pulseRate || !data.breathingRate) return 0.5;

    // Normalize pulse (100 awake -> 60 asleep for children)
    const pulseScore = Math.max(0, Math.min(1, (100 - data.pulseRate) / 40));

    // Normalize breathing (20 awake -> 12 asleep)
    const breathingScore = Math.max(0, Math.min(1, (20 - data.breathingRate) / 8));

    return (pulseScore + breathingScore) / 2;
  };

  const checkIfAsleep = (data: VitalsData): boolean => {
    if (!data.pulseRate || !data.breathingRate) return false;

    const isPulseInSleepRange = data.pulseRate < 75;
    const isBreathingInSleepRange = data.breathingRate < 16;
    const hasGoodQuality = (data.signalQuality ?? 0) > 0.7;

    return isPulseInSleepRange && isBreathingInSleepRange && hasGoodQuality;
  };

  const getStatusColor = () => {
    if (!isConnected || !vitals) return 'bg-gray-500';
    if (checkIfAsleep(vitals)) return 'bg-green-500';
    const sleepiness = calculateSleepiness(vitals);
    if (sleepiness > 0.7) return 'bg-blue-500';
    if (sleepiness > 0.4) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Not connected';
    if (!vitals) return 'Waiting for data...';
    if (checkIfAsleep(vitals)) return 'Asleep';
    const sleepiness = calculateSleepiness(vitals);
    if (sleepiness > 0.7) return 'Very sleepy';
    if (sleepiness > 0.4) return 'Getting sleepy';
    return 'Awake';
  };

  return (
    <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/20">
      <div className="space-y-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-white font-medium">{getStatusText()}</span>
        </div>

        {/* Vitals display */}
        {vitals && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {vitals.pulseRate && (
              <div>
                <div className="text-white/60">Heart Rate</div>
                <div className="text-white text-lg font-semibold">
                  {Math.round(vitals.pulseRate)} bpm
                </div>
              </div>
            )}
            
            {vitals.breathingRate && (
              <div>
                <div className="text-white/60">Breathing</div>
                <div className="text-white text-lg font-semibold">
                  {Math.round(vitals.breathingRate)} /min
                </div>
              </div>
            )}
            
            {vitals.signalQuality !== undefined && (
              <div className="col-span-2">
                <div className="text-white/60">Signal Quality</div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${vitals.signalQuality * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="text-white/60 text-sm text-center py-2">
            Open in iOS app to enable monitoring
          </div>
        )}
      </div>
    </Card>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    storyDriftBridge?: {
      startMonitoring: () => void;
      stopMonitoring: () => void;
    };
    receiveVitalsData?: (data: VitalsData) => void;
  }
}
