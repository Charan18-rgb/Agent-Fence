export interface ActionLog {
  id: string;
  timestamp: string;
  session_id?: string;
  agent_id: string;
  agent_role: string;
  tool_name: string;
  operation: string;
  parameters: Record<string, any>;
  resource_id?: string;
  sensitivity_level: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL';
  is_reversible: boolean;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';
  explanation: string;
  triggered_policies: string[];
  latency_ms: number;
  status: 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'REJECTED_BY_HUMAN' | 'APPROVED_AND_EXECUTED';
  tool_result?: Record<string, any>;
  approval_id?: string;
}

export interface ApprovalRequest {
  id: string;
  action_id: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  agent_id?: string;
  agent_role?: string;
  tool_name?: string;
  operation?: string;
  parameters: Record<string, any>;
  resource_id?: string;
  sensitivity_level?: string;
  risk_score: number;
  risk_level: string;
  explanation: string;
  triggered_policies: string[];
}

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action_decision: 'BLOCK' | 'REQUIRE_APPROVAL';
  parameters: Record<string, any>;
  is_active: boolean;
}

export interface DashboardStats {
  total_actions: number;
  allowed_count: number;
  require_approval_count: number;
  blocked_count: number;
  executed_count: number;
  allow_rate: number;
  block_rate: number;
  approval_rate: number;
  mean_latency_ms: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  tool_distribution: Record<string, number>;
}

export interface Scenario {
  id: string;
  name: string;
  category: string;
  description: string;
  expected_decision: string;
  actions: any[];
}
