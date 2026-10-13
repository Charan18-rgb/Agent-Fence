import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface DecisionBadgeProps {
  decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK' | string;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision }) => {
  switch (decision) {
    case 'ALLOW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          ALLOW
        </span>
      );
    case 'REQUIRE_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          REQUIRE APPROVAL
        </span>
      );
    case 'BLOCK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          BLOCK
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
          {decision}
        </span>
      );
  }
};

export const RiskBadge: React.FC<{ level: string; score?: number }> = ({ level, score }) => {
  const getColors = () => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getColors()}`}>
      {level} {score !== undefined && `(${score})`}
    </span>
  );
};
