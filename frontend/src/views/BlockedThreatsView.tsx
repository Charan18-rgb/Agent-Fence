import React from 'react';
import { ShieldAlert, AlertOctagon } from 'lucide-react';
import type { ActionLog } from '../types';
import { RiskBadge } from '../components/Badges';

interface BlockedThreatsViewProps {
  logs: ActionLog[];
}

export const BlockedThreatsView: React.FC<BlockedThreatsViewProps> = ({ logs }) => {
  const blockedLogs = logs.filter((l) => l.decision === 'BLOCK');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Blocked Security Threats &amp; Violations
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Forensic breakdown of prohibited operations, exfiltration attempts, and destructive actions neutralized by AgentFence.
        </p>
      </div>

      {blockedLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Blocked Threats Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Run the "Confidential File Exfiltration" or "DROP TABLE" scenario in the Simulator to inspect blocked threats here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockedLogs.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-gradient-to-b from-rose-950/20 to-slate-900 border border-rose-500/30 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  THREAT NEUTRALIZED
                </span>
                <RiskBadge level={item.risk_level} score={item.risk_score} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-indigo-400 font-mono">{item.tool_name}</span>
                  <span className="text-slate-500">::</span>
                  <span>{item.operation}</span>
                </h4>
                <p className="text-xs text-rose-200/90 font-mono mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/40">
                  {item.explanation}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Source Agent:</span>
                  <span className="font-semibold text-slate-200 font-mono">{item.agent_id} ({item.agent_role})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Resource Sensitivity:</span>
                  <span className="font-semibold text-amber-400">{item.sensitivity_level}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reversibility:</span>
                  <span className="font-semibold text-rose-400">{item.is_reversible ? 'Reversible' : 'Irreversible'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Payload:</span>
                <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-cyan-300 max-h-24 overflow-y-auto border border-slate-800">
                  {JSON.stringify(item.parameters, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                <span>Interception Latency: {item.latency_ms} ms</span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
