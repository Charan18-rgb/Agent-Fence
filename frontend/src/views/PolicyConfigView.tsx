import React, { useState } from 'react';
import { Sliders, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import type { SafetyPolicy } from '../types';
import { RiskBadge, DecisionBadge } from '../components/Badges';
import { togglePolicy } from '../api';

interface PolicyConfigViewProps {
  policies: SafetyPolicy[];
  onRefreshData: () => void;
}

export const PolicyConfigView: React.FC<PolicyConfigViewProps> = ({
  policies,
  onRefreshData,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (policy: SafetyPolicy) => {
    setTogglingId(policy.id);
    try {
      await togglePolicy(policy.id, !policy.is_active);
      onRefreshData();
    } catch (err: any) {
      console.error('Failed to toggle policy', err);
      alert('Toggle failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          Safety Policy Configuration &amp; Governance Rules
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Deterministic rule-sets actively enforced by AgentFence across all tool intercepters. Real-time active toggle enabled.
        </p>
      </div>

      <div className="space-y-4">
        {policies.map((p) => {
          const isToggling = togglingId === p.id;
          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                p.is_active
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-900/30 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${p.is_active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-semibold">{p.id}</span>
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Category: {p.rule_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <RiskBadge level={p.severity} />
                  <DecisionBadge decision={p.action_decision} />
                  
                  <button
                    onClick={() => handleToggle(p)}
                    disabled={isToggling}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    title={p.is_active ? 'Disable Policy' : 'Enable Policy'}
                  >
                    {p.is_active ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                {p.description}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <span className="text-[11px]">Enforcement Decision: <strong className="text-slate-200">{p.action_decision}</strong></span>
                <span className="text-[11px] font-mono text-slate-500">Status: {p.is_active ? 'Active Enforcing' : 'Disabled'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
