import React, { useState } from 'react';
import {
  Bot,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface GatewayVisualizationProps {
  lastResult?: {
    agent_id?: string;
    tool_name?: string;
    operation?: string;
    decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK' | string;
    risk_score?: number;
    risk_level?: string;
    triggered_policies?: string[];
    explanation?: string;
    tool_executed?: boolean;
    tool_result?: any;
    action_id?: string;
  } | null;
  onViewAuditRecord?: (actionId?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const GatewayVisualization: React.FC<GatewayVisualizationProps> = ({
  lastResult,
  onViewAuditRecord,
  onNavigateTab
}) => {
  // If no lastResult has been passed yet, present an interactive interactive mode or baseline standby state
  const [demoState, setDemoState] = useState<'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK' | null>(null);

  const activeDecision = lastResult ? lastResult.decision : demoState;
  const isAllow = activeDecision === 'ALLOW';
  const isApproval = activeDecision === 'REQUIRE_APPROVAL';
  const isBlock = activeDecision === 'BLOCK';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Live Policy Gateway Architecture Flow
            </h3>
            <p className="text-xs text-slate-400">
              Interactive structural trace: Autonomous Tool Request &rarr; Security Interceptor &rarr; Decision Engine &rarr; Target
            </p>
          </div>
        </div>

        {/* Interactive Mode Switches if in standby */}
        <div className="flex items-center gap-2">
          {!lastResult && (
            <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 px-2">Path Preview:</span>
              <button
                onClick={() => setDemoState('ALLOW')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                  isAllow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALLOW
              </button>
              <button
                onClick={() => setDemoState('REQUIRE_APPROVAL')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                  isApproval ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                APPROVAL
              </button>
              <button
                onClick={() => setDemoState('BLOCK')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                  isBlock ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BLOCK
              </button>
            </div>
          )}

          {lastResult && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg border bg-slate-950 text-slate-300 border-slate-800">
                Action: <strong className="text-white">{lastResult.agent_id || 'simulated-agent'}</strong>
              </span>
              {lastResult.action_id && (
                <button
                  onClick={() => onViewAuditRecord && onViewAuditRecord(lastResult.action_id)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono hover:underline"
                >
                  View Audit Record &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Flow SVG / Diagram Container */}
      <div className="py-6 px-2 overflow-x-auto">
        <div className="min-w-[680px] grid grid-cols-5 gap-3 items-center relative">

          {/* STEP 1: AI Agent */}
          <div className="flex flex-col items-center text-center p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 relative shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-100">AI Agent</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Originating Actor</span>
            <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 max-w-[110px] truncate">
              {lastResult?.agent_id || 'agent-support'}
            </div>
          </div>

          {/* CONNECTOR 1 */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-0.5 bg-slate-800 relative">
              <div className="absolute inset-0 bg-indigo-500/60 animate-pulse" />
            </div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 mt-1">Tool Request</span>
          </div>

          {/* STEP 2: Gateway Interceptor */}
          <div className="flex flex-col items-center text-center p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 relative shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-100">Action Interceptor</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Inspection Gateway</span>
            <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 max-w-[110px] truncate">
              {lastResult?.tool_name || 'database_tool'}
            </div>
          </div>

          {/* CONNECTOR 2 */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-0.5 bg-slate-800 relative">
              <div className="absolute inset-0 bg-cyan-500/60 animate-pulse" />
            </div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 mt-1">Policy Eval</span>
          </div>

          {/* STEP 3: Policy & Risk Engine */}
          <div className="flex flex-col items-center text-center p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/15 relative shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center mb-2">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-100">Policy Engine</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Deterministic Rules</span>
            <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Risk: <strong className={isBlock ? 'text-red-400' : isApproval ? 'text-amber-400' : 'text-emerald-400'}>{lastResult?.risk_score ?? (isBlock ? 95 : isApproval ? 65 : 12)}</strong>
            </div>
          </div>

        </div>

        {/* DECISION BRANCHING SECTION */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <span>Enforced Decision Paths:</span>
            <span className="text-[10px] text-slate-500 font-normal">Active path highlighted based on gateway evaluation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* PATH 1: ALLOW */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isAllow
                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                : 'bg-slate-950/40 border-slate-800/60 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${isAllow ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isAllow ? 'text-emerald-300' : 'text-slate-400'}`}>ALLOW</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Tool Executed
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] truncate">
                  &rarr; Dispatched to Mock Business Tool
                </span>
              </div>
            </div>

            {/* PATH 2: REQUIRE_APPROVAL */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isApproval
                ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/40'
                : 'bg-slate-950/40 border-slate-800/60 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${isApproval ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isApproval ? 'text-amber-300' : 'text-slate-400'}`}>REQUIRE APPROVAL</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Quarantined
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[11px]">&rarr; Held in HITL Review Queue</span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('approvals')}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Open Queue &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* PATH 3: BLOCK */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isBlock
                ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
                : 'bg-slate-950/40 border-slate-800/60 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <XCircle className={`w-4 h-4 ${isBlock ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isBlock ? 'text-rose-300' : 'text-slate-400'}`}>BLOCK</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Execution Prevented
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
                <span className="text-rose-400 font-bold">&times;</span>
                <span className="font-mono text-[11px] truncate">
                  Terminated at Gateway &bull; Logged to Audit
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Real Policy Outcome Explanatory Banner */}
        {lastResult?.explanation && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
            isBlock
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
              : isApproval
              ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
          }`}>
            <span className="font-bold shrink-0">GATEWAY RATIONALE:</span>
            <span>{lastResult.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
};
