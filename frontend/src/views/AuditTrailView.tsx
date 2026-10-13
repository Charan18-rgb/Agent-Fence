import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import type { ActionLog } from '../types';
import { DecisionBadge, RiskBadge } from '../components/Badges';

interface AuditTrailViewProps {
  logs: ActionLog[];
  initialFilter?: { decision?: string; tool_name?: string };
  highlightActionId?: string | null;
  onRefreshData: () => void;
  onFilterChange: (filters: { decision?: string; tool_name?: string }) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  logs,
  initialFilter,
  highlightActionId,
  onRefreshData,
  onFilterChange,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<string>(initialFilter?.decision || '');
  const [selectedTool, setSelectedTool] = useState<string>(initialFilter?.tool_name || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inspectLog, setInspectLog] = useState<ActionLog | null>(null);

  useEffect(() => {
    if (initialFilter?.decision !== undefined) {
      setSelectedDecision(initialFilter.decision);
    }
    if (initialFilter?.tool_name !== undefined) {
      setSelectedTool(initialFilter.tool_name);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (highlightActionId) {
      const match = logs.find((l) => l.id === highlightActionId);
      if (match) {
        setInspectLog(match);
      }
    }
  }, [highlightActionId, logs]);

  const handleDecisionFilter = (val: string) => {
    setSelectedDecision(val);
    onFilterChange({ decision: val || undefined, tool_name: selectedTool || undefined });
  };

  const handleToolFilter = (val: string) => {
    setSelectedTool(val);
    onFilterChange({ decision: selectedDecision || undefined, tool_name: val || undefined });
  };

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.agent_id.toLowerCase().includes(term) ||
      l.tool_name.toLowerCase().includes(term) ||
      l.operation.toLowerCase().includes(term) ||
      l.explanation.toLowerCase().includes(term) ||
      (l.resource_id && l.resource_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Audit Trail &amp; Telemetry Inspector
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Complete, tamper-evident log of intercepted agent tool requests, evaluation decisions, and execution outcomes.
          </p>
        </div>
        <button
          onClick={onRefreshData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search agent, tool, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          <select
            value={selectedDecision}
            onChange={(e) => handleDecisionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
            <option value="BLOCK">BLOCK</option>
          </select>

          <select
            value={selectedTool}
            onChange={(e) => handleToolFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Tools</option>
            <option value="email_tool">email_tool</option>
            <option value="database_tool">database_tool</option>
            <option value="document_tool">document_tool</option>
            <option value="file_tool">file_tool</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredLogs.length} record(s)
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 bg-slate-800/30">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Agent</th>
                <th className="py-3 px-3">Target &amp; Operation</th>
                <th className="py-3 px-3">Sensitivity</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-semibold">{log.agent_id}</div>
                    <div className="text-[10px] text-slate-500">{log.agent_role}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <span className="text-indigo-400 font-mono">{log.tool_name}</span>
                    <div className="text-[11px] text-slate-400">{log.operation}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {log.sensitivity_level}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <DecisionBadge decision={log.decision} />
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge level={log.risk_level} score={log.risk_score} />
                  </td>
                  <td className="py-3 px-3 text-[11px] font-mono text-slate-400">
                    {log.status}
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">
                    {log.latency_ms} ms
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => setInspectLog(log)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-all"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Action Inspection Details</h3>
                <span className="text-xs font-mono text-slate-400">ID: {inspectLog.id}</span>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <DecisionBadge decision={inspectLog.decision} />
                <RiskBadge level={inspectLog.risk_level} score={inspectLog.risk_score} />
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Policy Rationale:</span>
                <p className="p-2.5 rounded-lg bg-slate-950 font-mono text-slate-200 mt-1 border border-slate-800">
                  {inspectLog.explanation}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Triggered Policy Rules:</span>
                <ul className="list-disc pl-5 text-amber-300 mt-1 space-y-1">
                  {inspectLog.triggered_policies.length > 0 ? (
                    inspectLog.triggered_policies.map((p, i) => <li key={i}>{p}</li>)
                  ) : (
                    <li className="text-slate-500">None (Action matched safe parameters)</li>
                  )}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Action Request Parameters:</span>
                <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 overflow-x-auto">
                  {JSON.stringify(inspectLog.parameters, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Execution / Dispatch Outcome:</span>
                <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto">
                  {JSON.stringify(inspectLog.tool_result, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
