import React, { useState } from 'react';
import { 
  UserCheck, 
  Check, 
  X, 
  RefreshCw 
} from 'lucide-react';
import type { ApprovalRequest } from '../types';
import { RiskBadge } from '../components/Badges';
import { submitApprovalReview } from '../api';

interface ApprovalQueueViewProps {
  approvals: ApprovalRequest[];
  onRefreshData: () => void;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({
  approvals,
  onRefreshData,
}) => {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [reviewerName, setReviewerName] = useState('security_operator_01');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    setSubmitting(true);
    try {
      await submitApprovalReview(
        selectedApproval.id,
        decision,
        reviewerName,
        reviewNotes
      );
      setSelectedApproval(null);
      setReviewNotes('');
      onRefreshData();
    } catch (err: any) {
      console.error('Review submission failed', err);
      alert('Review failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Human-in-the-Loop (HITL) Approval Queue
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Quarantined agent actions requiring authorized human review prior to business tool execution.
          </p>
        </div>
        <button
          onClick={onRefreshData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {approvals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Approval Queue is Clear</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No agent operations are currently pending human review. Run the "Multi-Step Recon &amp; Purge" scenario to test quarantining!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of pending requests */}
          <div className="lg:col-span-7 space-y-3">
            {approvals.map((req) => {
              const isSelected = selectedApproval?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedApproval(req)}
                  className={`p-5 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-indigo-400">
                      {req.tool_name} :: {req.operation}
                    </span>
                    <RiskBadge level={req.risk_level} score={req.risk_score} />
                  </div>

                  <p className="text-xs text-slate-300 font-mono mt-2 line-clamp-2">
                    {req.explanation}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Agent: <strong className="text-slate-300 font-mono">{req.agent_id}</strong> ({req.agent_role})</span>
                    <span className="text-[11px] text-slate-500">{new Date(req.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inspection and Review Action Panel */}
          <div className="lg:col-span-5">
            {selectedApproval ? (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 sticky top-24 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Review Request</h3>
                    <span className="text-[11px] font-mono text-slate-400">ID: {selectedApproval.id}</span>
                  </div>
                  <RiskBadge level={selectedApproval.risk_level} score={selectedApproval.risk_score} />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Triggered Policy Reason:</span>
                    <p className="text-slate-200 mt-1 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {selectedApproval.explanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-slate-500 block">Target Tool</span>
                      <span className="font-semibold text-slate-200">{selectedApproval.tool_name}</span>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-slate-500 block">Operation</span>
                      <span className="font-semibold text-slate-200">{selectedApproval.operation}</span>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-slate-500 block">Sensitivity</span>
                      <span className="font-semibold text-amber-400">{selectedApproval.sensitivity_level}</span>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-lg">
                      <span className="text-slate-500 block">Agent Role</span>
                      <span className="font-semibold text-slate-200">{selectedApproval.agent_role}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium mb-1">Payload Parameters:</span>
                    <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(selectedApproval.parameters, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Form to approve / reject */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Reviewer Username</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Review Notes / Rationale</label>
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add justification for audit trail..."
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleReview('APPROVED')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve &amp; Execute
                    </button>
                    <button
                      onClick={() => handleReview('REJECTED')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject &amp; Discard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                Select a pending request from the list to review action details and submit a decision.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
