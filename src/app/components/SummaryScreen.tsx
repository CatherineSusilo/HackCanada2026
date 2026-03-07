import { Moon, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import type { StorySummary } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';

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
    <div className="size-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon className="w-10 h-10 text-indigo-300" />
            <h1 className="text-4xl text-white">Drift Complete</h1>
          </div>
          <p className="text-indigo-200">Your child has drifted to sleep</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 space-y-8">
          <div>
            <h2 className="text-white mb-6">Tonight's Story</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Moon className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="text-white">{summary.title}</div>
                  <div className="text-indigo-300 text-sm mt-1">Personalized bedtime story</div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="text-white">Story Duration: {summary.duration}</div>
                  <div className="text-indigo-300 text-sm mt-1">
                    Sleep onset: {summary.sleepOnsetTime}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex-1">
                  <div className="text-white mb-3">Drift Score Progress</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="time"
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.7)' }}
                          domain={[0, 100]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#818cf8"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorScore)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-indigo-300 text-sm mt-2">
                    Smooth progression toward restful sleep
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <button
              onClick={onStartOver}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Start New Story</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-indigo-300/60 text-sm">
              Over 30 nights, StoryDrift learns what works best for your child
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
