import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartDataPoint } from '../types';

interface LineGraphProps {
  data: ChartDataPoint[];
  color?: string;
}

export const LineGraph: React.FC<LineGraphProps> = ({ data, color = "#22d3ee" }) => {
  return (
    <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-800 p-2 sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="time" 
            hide={true} 
            type="number" 
            domain={['dataMin', 'dataMax']} 
          />
          <YAxis 
            hide={false} 
            width={30} 
            stroke="#64748b" 
            tick={{fontSize: 10}}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [`${value.toFixed(1)} Mbps`, "Speed"]}
            labelFormatter={() => ''}
          />
          <Area 
            type="monotone" 
            dataKey="speed" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSpeed)" 
            animationDuration={300}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};