import React from 'react';
import { AnalysisResponse } from '../types';
import { Tv, Gamepad2, Video, Bot } from 'lucide-react';

interface AnalysisCardProps {
  analysis: AnalysisResponse;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  return (
    <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm animate-fade-in-up">
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-indigo-100">AI Network Insights</h3>
      </div>

      <div className="mb-6 p-3 sm:p-4 bg-slate-900/50 rounded-xl border-l-4 border-indigo-500">
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col p-3 sm:p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/40 transition-colors">
          <div className="flex items-center space-x-2 mb-2 text-cyan-400">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Streaming</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">{analysis.streaming}</p>
        </div>
        <div className="flex flex-col p-3 sm:p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/40 transition-colors">
          <div className="flex items-center space-x-2 mb-2 text-emerald-400">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Gaming</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">{analysis.gaming}</p>
        </div>
        <div className="flex flex-col p-3 sm:p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/40 transition-colors">
          <div className="flex items-center space-x-2 mb-2 text-rose-400">
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Video Calls</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">{analysis.videoCalls}</p>
        </div>
      </div>
    </div>
  );
};