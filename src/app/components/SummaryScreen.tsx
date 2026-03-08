import { Clock, TrendingUp, Home } from 'lucide-react';
import { motion } from 'motion/react';
import type { StorySummary } from '../App';
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface SummaryScreenProps {
  summary: StorySummary;
  onStartOver: () => void;
}

export function SummaryScreen({ summary, onStartOver }: SummaryScreenProps) {
  const chartData = summary.driftCurve.map((score, index) => ({
    time: index,
    score: Math.round(score),
  }));

  return (
    <div 
      className="size-full flex items-center justify-center p-6 overflow-auto relative"
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

      <div className="w-full max-w-2xl relative z-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center mb-6"
        >
          <h1 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '48px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '8px' }}>
            drift complete
          </h1>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '20px', color: 'rgba(30, 20, 15, 0.7)' }}>
            sweet dreams await...
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 space-y-6"
          style={{
            background: 'rgba(250, 245, 235, 0.85)',
            border: '2px solid rgba(40, 30, 20, 0.3)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div>
            <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '20px' }}>
              tonight's tale
            </h2>
            <div className="space-y-4">
              <div 
                className="flex items-start gap-4 p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.5)',
                  border: '1px solid rgba(40, 30, 20, 0.2)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(210, 180, 140, 0.5)', border: '2px solid rgba(40, 30, 20, 0.3)' }}
                >
                  <span style={{ fontSize: '24px' }}>📖</span>
                </div>
                <div>
                  <div style={{ fontFamily: "'Indie Flower', cursive", fontSize: '20px', color: 'rgba(20, 15, 10, 0.85)' }}>
                    {summary.title}
                  </div>
                  <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)', marginTop: '4px' }}>
                    personalized bedtime tale
                  </div>
                </div>
              </div>

              <div 
                className="flex items-start gap-4 p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.5)',
                  border: '1px solid rgba(40, 30, 20, 0.2)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(180, 200, 220, 0.4)', border: '2px solid rgba(40, 30, 20, 0.3)' }}
                >
                  <Clock className="w-6 h-6" style={{ color: 'rgba(40, 60, 80, 0.7)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(20, 15, 10, 0.85)' }}>
                    story duration: {summary.duration}
                  </div>
                  <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)', marginTop: '4px' }}>
                    sleep onset: {summary.sleepOnsetTime}
                  </div>
                </div>
              </div>

              <div 
                className="flex items-start gap-4 p-5"
                style={{
                  background: 'rgba(250, 245, 235, 0.5)',
                  border: '1px solid rgba(40, 30, 20, 0.2)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(160, 200, 160, 0.4)', border: '2px solid rgba(40, 30, 20, 0.3)' }}
                >
                  <TrendingUp className="w-6 h-6" style={{ color: 'rgba(60, 100, 60, 0.7)' }} />
                </div>
                <div className="flex-1">
                  <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', color: 'rgba(20, 15, 10, 0.85)', marginBottom: '16px' }}>
                    drift score progress
                  </div>
                  <div 
                    className="h-48 p-3"
                    style={{
                      background: 'rgba(255, 250, 240, 0.6)',
                      border: '1px solid rgba(40, 30, 20, 0.2)',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgba(100, 120, 80, 0.8)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="rgba(100, 120, 80, 0.8)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(80, 60, 40, 0.2)" />
                        <XAxis
                          dataKey="time"
                          stroke="rgba(60, 50, 40, 0.5)"
                          tick={{ fill: 'rgba(60, 50, 40, 0.7)', fontFamily: "'Patrick Hand', cursive" }}
                        />
                        <YAxis
                          stroke="rgba(60, 50, 40, 0.5)"
                          tick={{ fill: 'rgba(60, 50, 40, 0.7)', fontFamily: "'Patrick Hand', cursive" }}
                          domain={[0, 100]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="rgba(80, 100, 60, 0.8)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorScore)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(30, 20, 15, 0.6)', marginTop: '12px' }}>
                    smooth progression toward restful slumber
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(40, 30, 20, 0.2)' }}>
            <button
              onClick={onStartOver}
              className="w-full px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '22px',
                color: 'rgba(20, 15, 10, 0.8)',
                background: 'rgba(60, 50, 40, 0.08)',
                border: '1px solid rgba(30, 20, 15, 0.3)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(60, 50, 40, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(60, 50, 40, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.3)';
              }}
            >
              <Home className="w-5 h-5" />
              <span>back to dashboard</span>
            </button>
          </div>

          <div className="text-center">
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '15px', color: 'rgba(40, 30, 20, 0.55)' }}>
              over thirty moons, storydrift learns what works best
            </p>
          </div>
        </motion.div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}
