import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Play, 
  ArrowRight
} from 'lucide-react';
import type { DashboardStats, ActionLog } from '../types';
import { DecisionBadge } from '../components/Badges';
import { GatewayVisualization } from '../components/GatewayVisualization';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  recentActions: ActionLog[];
  onNavigateTab: (tab: string, filter?: string) => void;
  onQuickSimulate: (scenarioId: string) => void;
  onViewAuditRecord?: (actionId?: string) => void;
  lastSimResult?: any;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  recentActions,
  onNavigateTab,
  onQuickSimulate,
  onViewAuditRecord,
  lastSimResult,
}) => {
  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Safety Control &amp; Policy Enforcement Gateway
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Actively intercepting autonomous agent operations before tool execution. Enforcing deterministic security policies, protected database schemas, data exfiltration defenses, and human signoff workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('simulator')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Run Agent Simulator
            </button>
            <button
              onClick={() => onNavigateTab('approvals')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-medium text-sm border border-slate-700 transition-all cursor-pointer"
            >
              Approval Queue ({stats?.require_approval_count ?? 0})
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Gateway Flow Diagram */}
      <GatewayVisualization
        lastResult={lastSimResult || (recentActions.length > 0 ? recentActions[0] : null)}
        onViewAuditRecord={onViewAuditRecord}
        onNavigateTab={onNavigateTab}
      />

      {/* Metrics Cards Grid - Clickable Drilldowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Actions Intercepted */}
        <button
          onClick={() => onNavigateTab('audit')}
          className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-300 transition-colors">
              Total Interceptions
            </span>
            <Activity className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.total_actions ?? 0}</span>
            <span className="text-xs text-slate-400">actions evaluated</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Avg: <strong className="text-cyan-300">{stats?.mean_latency_ms ?? 0} ms</strong></span>
            </div>
            <span className="text-[11px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              Audit &rarr;
            </span>
          </div>
        </button>

        {/* Safe Actions Allowed */}
        <button
          onClick={() => onNavigateTab('audit', 'ALLOW')}
          className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-emerald-300 transition-colors">
              Safe Allowed
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{stats?.allowed_count ?? 0}</span>
            <span className="text-xs font-semibold text-emerald-500/90">{stats?.allow_rate ?? 0}% rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Executed in mock sandbox</span>
            <span className="text-[11px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Filter &rarr;
            </span>
          </div>
        </button>

        {/* Blocked Threats */}
        <button
          onClick={() => onNavigateTab('threats')}
          className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/90 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-rose-300 transition-colors">
              Unsafe Blocked
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{stats?.blocked_count ?? 0}</span>
            <span className="text-xs font-semibold text-rose-500/90">{stats?.block_rate ?? 0}% rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Prevented tool execution</span>
            <span className="text-[11px] text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Threats &rarr;
            </span>
          </div>
        </button>

        {/* Quarantined for HITL Approval */}
        <button
          onClick={() => onNavigateTab('approvals')}
          className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-300 transition-colors">
              Held for Approval
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{stats?.require_approval_count ?? 0}</span>
            <span className="text-xs font-semibold text-amber-500/90">{stats?.approval_rate ?? 0}% rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Requires human operator sign-off</span>
            <span className="text-[11px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Queue &rarr;
            </span>
          </div>
        </button>
      </div>

      {/* Quick Launch & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets / Demo triggers */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Preset Benchmark Scenarios</h3>
              <p className="text-xs text-slate-400">Click any scenario to simulate an agent tool call through the gateway</p>
            </div>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Advanced Simulator <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onQuickSimulate('scenario_1_authorized_doc_read')}
              className="p-4 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  SAFE READ
                </span>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-100">Authorized Document Read</h4>
              <p className="mt-1 text-xs text-slate-400">Support agent reading public overview documentation (Decision: ALLOW).</p>
            </button>

            <button
              onClick={() => onQuickSimulate('scenario_2_confidential_data_exfil')}
              className="p-4 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-rose-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  EXFILTRATION ATTACK
                </span>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-100">Confidential Email Exfiltration</h4>
              <p className="mt-1 text-xs text-slate-400">Dispatching confidential ledger to untrusted external recipient (Decision: BLOCK).</p>
            </button>

            <button
              onClick={() => onQuickSimulate('scenario_3_drop_protected_table')}
              className="p-4 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-rose-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  CATASTROPHIC SQL
                </span>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-100">DROP TABLE customer_pii</h4>
              <p className="mt-1 text-xs text-slate-400">Agent executing destructive SQL DROP on sensitive database schema (Decision: BLOCK).</p>
            </button>

            <button
              onClick={() => onQuickSimulate('scenario_4_suspicious_sequence')}
              className="p-4 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  SUSPICIOUS CHAIN
                </span>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-100">Multi-Step Recon & Purge</h4>
              <p className="mt-1 text-xs text-slate-400">Search -&gt; Confidential M&amp;A Read -&gt; Irreversible File Purge (Requires Approval).</p>
            </button>
          </div>
        </div>

        {/* Telemetry Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-white">Risk Severity Distribution</h3>
          <p className="text-xs text-slate-400">Deterministic risk score clustering across actions</p>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-medium">Critical Risk (&gt;= 85)</span>
                <span className="text-slate-300 font-semibold">{stats?.risk_distribution.CRITICAL ?? 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, ((stats?.risk_distribution.CRITICAL ?? 0) / Math.max(1, stats?.total_actions ?? 1)) * 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400 font-medium">High Risk (60 - 84)</span>
                <span className="text-slate-300 font-semibold">{stats?.risk_distribution.HIGH ?? 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, ((stats?.risk_distribution.HIGH ?? 0) / Math.max(1, stats?.total_actions ?? 1)) * 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-yellow-400 font-medium">Medium Risk (35 - 59)</span>
                <span className="text-slate-300 font-semibold">{stats?.risk_distribution.MEDIUM ?? 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, ((stats?.risk_distribution.MEDIUM ?? 0) / Math.max(1, stats?.total_actions ?? 1)) * 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-medium">Low Risk (&lt; 35)</span>
                <span className="text-slate-300 font-semibold">{stats?.risk_distribution.LOW ?? 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, ((stats?.risk_distribution.LOW ?? 0) / Math.max(1, stats?.total_actions ?? 1)) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Interception Stream */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Recent Gateway Interceptions</h3>
          <button
            onClick={() => onNavigateTab('audit')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No agent actions recorded yet. Run a scenario above to test the gateway!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-800/20">
                <tr>
                  <th className="py-3 px-3">Agent</th>
                  <th className="py-3 px-3">Target Tool &amp; Op</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Explanation</th>
                  <th className="py-3 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentActions.slice(0, 5).map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <div>{act.agent_id}</div>
                      <div className="text-[10px] text-slate-500">{act.agent_role}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      <span className="text-indigo-400">{act.tool_name}</span>
                      <div className="text-[11px] text-slate-400">{act.operation}</div>
                    </td>
                    <td className="py-3 px-3">
                      <DecisionBadge decision={act.decision} />
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${act.risk_score >= 80 ? 'text-red-400' : act.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {act.risk_score} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={act.explanation}>
                      {act.explanation}
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-400">
                      {act.latency_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
