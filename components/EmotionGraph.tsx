import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { EmotionDataPoint } from '../types';

interface EmotionGraphProps {
  data: EmotionDataPoint[];
}

const EmotionGraph: React.FC<EmotionGraphProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Real-time Emotional Analysis</h3>
      <div className="h-48 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={[0, 1]} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b' }}
            />
            <Legend />
            <Line 
                type="monotone" 
                dataKey="stress" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6 }} 
                name="Stress"
            />
            <Line 
                type="monotone" 
                dataKey="anxiety" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                dot={false} 
                name="Anxiety"
            />
            <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="#22c55e" 
                strokeWidth={2} 
                dot={false} 
                name="Calm"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmotionGraph;
