from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ToolActionRequest(BaseModel):
    agent_id: str = Field(..., description="Unique identifier for the agent initiating the action")
    agent_role: str = Field(..., description="Role assigned to the agent (e.g., support, analyst, billing)")
    tool_name: str = Field(..., description="Target business tool (database_tool, email_tool, file_tool, document_tool)")
    operation: str = Field(..., description="Requested operation (e.g., query, send_email, delete_file, read_document)")
    parameters: dict[str, Any] = Field(default_factory=dict, description="Parameters to be passed to the tool")
    resource_id: Optional[str] = Field(None, description="Identifier of the resource being accessed/modified")
    sensitivity_level: str = Field("INTERNAL", description="Resource sensitivity: PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL")
    is_reversible: bool = Field(True, description="Whether the operation can be undone")
    session_id: Optional[str] = Field(None, description="Session or workflow identifier")

class InterceptorResponse(BaseModel):
    action_id: str
    decision: str  # ALLOW, REQUIRE_APPROVAL, BLOCK
    risk_score: float  # 0 to 100
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    triggered_policies: list[str]
    explanation: str
    status: str
    approval_id: Optional[str] = None
    tool_executed: bool = False
    tool_result: Optional[dict[str, Any]] = None
    latency_ms: float

class ActionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    timestamp: datetime
    session_id: Optional[str]
    agent_id: str
    agent_role: str
    tool_name: str
    operation: str
    parameters: dict[str, Any]
    resource_id: Optional[str]
    sensitivity_level: str
    is_reversible: bool
    risk_score: float
    risk_level: str
    decision: str
    explanation: str
    triggered_policies: list[str]
    latency_ms: float
    status: str
    tool_result: Optional[dict[str, Any]]
    approval_id: Optional[str] = None

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED or REJECTED")
    reviewer: str = Field("security_admin", description="Username or ID of the human reviewer")
    reason: Optional[str] = Field(None, description="Rationale for approval or rejection")

class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    action_id: str
    created_at: datetime
    status: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    action_log: Optional[ActionLogResponse] = None

class SafetyPolicySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: str
    rule_type: str
    severity: str
    action_decision: str
    parameters: dict[str, Any]
    is_active: bool

class PolicyToggleRequest(BaseModel):
    is_active: bool

class DashboardStats(BaseModel):
    total_actions: int
    allowed_count: int
    require_approval_count: int
    blocked_count: int
    executed_count: int
    allow_rate: float
    block_rate: float
    approval_rate: float
    mean_latency_ms: float
    risk_distribution: dict[str, int]
    tool_distribution: dict[str, int]
