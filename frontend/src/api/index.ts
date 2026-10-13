import axios from 'axios';
import type { ActionLog, ApprovalRequest, DashboardStats, SafetyPolicy, Scenario } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/stats');
  return res.data;
};

export const fetchAuditTrail = async (params?: {
  decision?: string;
  tool_name?: string;
  status?: string;
  limit?: number;
}): Promise<{ total: number; items: ActionLog[] }> => {
  const res = await api.get('/audit', { params });
  return res.data;
};

export const fetchPendingApprovals = async (): Promise<ApprovalRequest[]> => {
  const res = await api.get('/approvals');
  return res.data;
};

export const submitApprovalReview = async (
  approvalId: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewer: string,
  reason?: string
) => {
  const res = await api.post(`/approvals/${approvalId}/review`, {
    decision,
    reviewer,
    reason,
  });
  return res.data;
};

export const fetchPolicies = async (): Promise<SafetyPolicy[]> => {
  const res = await api.get('/policies');
  return res.data;
};

export const togglePolicy = async (policyId: string, isActive: boolean) => {
  const res = await api.patch(`/policies/${policyId}/toggle`, {
    is_active: isActive,
  });
  return res.data;
};

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const res = await api.get('/simulator/scenarios');
  return res.data;
};

export const runScenario = async (scenarioId: string) => {
  const res = await api.post(`/simulator/run/${scenarioId}`);
  return res.data;
};

export const interceptDirectAction = async (actionPayload: any) => {
  const res = await api.post('/intercept', actionPayload);
  return res.data;
};
