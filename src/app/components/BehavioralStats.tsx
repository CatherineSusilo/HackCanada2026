import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Smile, Heart, Wind } from 'lucide-react';
import { useApi } from '../../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface VitalsPoint {
  timestamp: string;
  pulseRate?: number;
  breathingRate?: number;
}

function VitalsLineChart({ 
  data, 
  dataKey, 
  color, 
  label, 
  unit,
}: { 
  data: VitalsPoint[]; 
  dataKey: 'pulseRate' | 'breathingRate'; 
  color: string; 
  label: string; 
  unit: string;
}) {
  const values = data.map(d => d[dataKey]).filter((v): v is number => v != null && v > 0);
  if (values.length < 2) return null;

  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const chartData = data
    .filter(d => d[dataKey] != null && d[dataKey]! > 0)
    .map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      value: Math.round((d[dataKey] as number) * 10) / 10,
    }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30,20,15,0.7)' }}>
          {label}
        </span>
        <span style={{ fontFamily: "'Indie Flower', cursive", fontSize: '22px', fontWeight: 'bold', color: 'rgba(20,15,10,0.85)' }}>
          avg: {avg} {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,20,15,0.08)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11, fill: 'rgba(30,20,15,0.5)', fontFamily: "'Patrick Hand', cursive" }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(30,20,15,0.15)' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 11, fill: 'rgba(30,20,15,0.5)', fontFamily: "'Patrick Hand', cursive" }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(30,20,15,0.15)' }}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(250, 245, 235, 0.95)',
              border: '1px solid rgba(40, 30, 20, 0.2)',
              borderRadius: '4px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '14px',
            }}
            formatter={(value: number) => [`${value} ${unit}`, label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#gradient-${dataKey})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BehavioralStatsProps {
  onBack?: () => void;
}

export function BehavioralStats({ onBack }: BehavioralStatsProps) {
  const api = useApi();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [vitalsData, setVitalsData] = useState<VitalsPoint[]>([]);
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

      // Load vitals data — try from recent story sessions first, then from vitals readings
      try {
        const stories = await api.getStories(childId, 10, 0);
        const allVitals: VitalsPoint[] = [];
        if (stories?.data) {
          for (const story of stories.data) {
            if (story.vitalsHistory && Array.isArray(story.vitalsHistory)) {
              allVitals.push(...story.vitalsHistory);
            }
          }
        }
        // Also try fetching from the vitals endpoint
        try {
          const readings = await api.getChildVitals(childId, 48);
          if (Array.isArray(readings) && readings.length > 0) {
            allVitals.push(...readings.map((r: any) => ({
              timestamp: r.timestamp,
              pulseRate: r.pulseRate,
              breathingRate: r.breathingRate,
            })));
          }
        } catch {}
        // Sort by timestamp and deduplicate
        allVitals.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setVitalsData(allVitals);
      } catch (e) {
        console.warn('Failed to load vitals data:', e);
      }
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
        <div className="mb-8">
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
                  {stats.insights?.avgEngagement || '—'}
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
                  {stats.insights?.favoriteThemes?.length > 0 ? stats.insights.favoriteThemes.join(', ') : 'not enough stories yet'}
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
                  {stats.insights?.learningInsight || 'keep reading stories to unlock insights'}
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
                  {stats.insights?.favoriteCharacters?.length > 0 ? stats.insights.favoriteCharacters.join(', ') : 'not enough stories yet'}
                </p>
              </motion.div>
            </div>

            {/* Vitals Charts — Heart Rate & Breathing */}
            {vitalsData.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                {/* Heart Rate Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-6"
                  style={{
                    background: 'rgba(250, 245, 235, 0.8)',
                    border: '2px solid rgba(40, 30, 20, 0.25)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5" style={{ color: 'rgba(180, 60, 60, 0.8)' }} />
                    <h3
                      style={{
                        fontFamily: "'Indie Flower', cursive",
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: 'rgba(20, 15, 10, 0.85)',
                      }}
                    >
                      heart rate
                    </h3>
                  </div>
                  <VitalsLineChart
                    data={vitalsData}
                    dataKey="pulseRate"
                    color="#c0392b"
                    label="during bedtime stories"
                    unit="bpm"
                  />
                </motion.div>

                {/* Breathing Rate Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6"
                  style={{
                    background: 'rgba(250, 245, 235, 0.8)',
                    border: '2px solid rgba(40, 30, 20, 0.25)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Wind className="w-5 h-5" style={{ color: 'rgba(40, 120, 140, 0.8)' }} />
                    <h3
                      style={{
                        fontFamily: "'Indie Flower', cursive",
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: 'rgba(20, 15, 10, 0.85)',
                      }}
                    >
                      breathing rate
                    </h3>
                  </div>
                  <VitalsLineChart
                    data={vitalsData}
                    dataKey="breathingRate"
                    color="#2980b9"
                    label="during bedtime stories"
                    unit="breaths/min"
                  />
                </motion.div>
              </div>
            )}

            {vitalsData.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 mb-8 text-center"
                style={{
                  background: 'rgba(250, 245, 235, 0.6)',
                  border: '2px dashed rgba(40, 30, 20, 0.2)',
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Heart className="w-5 h-5" style={{ color: 'rgba(30, 20, 15, 0.4)' }} />
                  <Wind className="w-5 h-5" style={{ color: 'rgba(30, 20, 15, 0.4)' }} />
                </div>
                <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '16px', color: 'rgba(30, 20, 15, 0.5)' }}>
                  vitals data will appear here after bedtime stories with the companion phone app
                </p>
              </motion.div>
            )}

          </>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
