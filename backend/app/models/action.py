import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    session_id = Column(String(100), nullable=True, index=True)
    agent_id = Column(String(100), nullable=False, index=True)
    agent_role = Column(String(100), nullable=False)
    
    # Intercepted action details
    tool_name = Column(String(100), nullable=False, index=True)
    operation = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=False, default=dict)
    resource_id = Column(String(200), nullable=True)
    sensitivity_level = Column(String(50), nullable=False, default="INTERNAL")  # PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL
    is_reversible = Column(Boolean, default=True)
    
    # Policy Evaluation results
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    decision = Column(String(50), nullable=False, index=True)  # ALLOW, REQUIRE_APPROVAL, BLOCK
    explanation = Column(Text, nullable=False)
    triggered_policies = Column(JSON, nullable=False, default=list)
    latency_ms = Column(Float, default=0.0)
    
    # Execution & Workflow tracking
    status = Column(String(50), nullable=False, default="EVALUATED") # EXECUTED, BLOCKED, PENDING_APPROVAL, REJECTED, APPROVED_AND_EXECUTED
    tool_result = Column(JSON, nullable=True)
    
    # Relationship to approval request
    approval_request = relationship("ApprovalRequest", back_populates="action_log", uselist=False, cascade="all, delete-orphan")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    action_id = Column(String(36), ForeignKey("action_logs.id"), nullable=False, unique=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    
    action_log = relationship("ActionLog", back_populates="approval_request")


class SafetyPolicy(Base):
    __tablename__ = "safety_policies"

    id = Column(String(50), primary_key=True, index=True) # e.g. POL-SQL-01
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    rule_type = Column(String(50), nullable=False) # SQL_PROTECTION, DATA_EXFIL, ACCESS_CONTROL, DESTRUCTIVE_OP
    severity = Column(String(50), nullable=False, default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    action_decision = Column(String(50), nullable=False, default="BLOCK") # BLOCK, REQUIRE_APPROVAL
    parameters = Column(JSON, nullable=False, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
