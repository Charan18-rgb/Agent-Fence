import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './views/DashboardOverview';
import { AgentSimulatorView } from './views/AgentSimulatorView';
import { ApprovalQueueView } from './views/ApprovalQueueView';
import { AuditTrailView } from './views/AuditTrailView';
import { BlockedThreatsView } from './views/BlockedThreatsView';
import { PolicyConfigView } from './views/PolicyConfigView';
import { 
  fetchDashboardStats, 
  fetchAuditTrail, 
  fetchPendingApprovals, 
  fetchPolicies, 
  fetchScenarios,
  runScenario 
} from './api';
import type { DashboardStats, ActionLog, ApprovalRequest, SafetyPolicy, Scenario } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<ActionLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [policies, setPolicies] = useState<SafetyPolicy[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAllData = async (auditFilters?: { decision?: string; tool_name?: string }) => {
    try {
      const [statsData, auditData, approvalsData, policiesData, scenariosData] = await Promise.all([
        fetchDashboardStats(),
        fetchAuditTrail(auditFilters),
        fetchPendingApprovals(),
        fetchPolicies(),
        fetchScenarios(),
      ]);

      setStats(statsData);
      setAuditLogs(auditData.items || []);
      setApprovals(approvalsData || []);
      setPolicies(policiesData || []);
      setScenarios(scenariosData || []);
    } catch (err) {
      console.error('Error fetching AgentFence telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [auditFilter, setAuditFilter] = useState<{ decision?: string; tool_name?: string }>({});
  const [highlightActionId, setHighlightActionId] = useState<string | null>(null);
  const [lastSimResult, setLastSimResult] = useState<any | null>(null);

  const handleNavigateTab = (tab: string, filterDecision?: string) => {
    if (filterDecision) {
      setAuditFilter({ decision: filterDecision });
    }
    setCurrentTab(tab);
  };

  const handleViewAuditRecord = (actionId?: string) => {
    if (actionId) {
      setHighlightActionId(actionId);
    }
    setCurrentTab('audit');
  };

  const handleQuickSimulate = async (scenarioId: string) => {
    try {
      const result = await runScenario(scenarioId);
      if (result && result.results && result.results.length > 0) {
        setLastSimResult(result.results[result.results.length - 1]);
      }
      await loadAllData();
      setCurrentTab('dashboard');
    } catch (err) {
      console.error('Failed to trigger quick simulation', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== 'audit') setAuditFilter({});
          setCurrentTab(tab);
        }}
        pendingApprovalsCount={approvals.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
            Connecting to AgentFence Safety Gateway...
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardOverview
                stats={stats}
                recentActions={auditLogs}
                onNavigateTab={handleNavigateTab}
                onQuickSimulate={handleQuickSimulate}
                onViewAuditRecord={handleViewAuditRecord}
                lastSimResult={lastSimResult}
              />
            )}

            {currentTab === 'simulator' && (
              <AgentSimulatorView
                scenarios={scenarios}
                onRefreshData={() => loadAllData()}
              />
            )}

            {currentTab === 'approvals' && (
              <ApprovalQueueView
                approvals={approvals}
                onRefreshData={() => loadAllData()}
              />
            )}

            {currentTab === 'audit' && (
              <AuditTrailView
                logs={auditLogs}
                initialFilter={auditFilter}
                highlightActionId={highlightActionId}
                onRefreshData={() => loadAllData()}
                onFilterChange={(filters) => {
                  setAuditFilter(filters);
                  loadAllData(filters);
                }}
              />
            )}

            {currentTab === 'threats' && (
              <BlockedThreatsView logs={auditLogs} />
            )}

            {currentTab === 'policies' && (
              <PolicyConfigView
                policies={policies}
                onRefreshData={() => loadAllData()}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        AgentFence &mdash; AI Agent Safety and Control Gateway &bull; DevHost 2026 DevHack 2026
      </footer>
    </div>
  );
}

export default App;
