import time
from typing import Any
from sqlalchemy.orm import Session
from app.models.action import ActionLog, ApprovalRequest, SafetyPolicy
from app.schemas.action import ToolActionRequest, InterceptorResponse
from app.engine.policy_engine import PolicyEngine
from app.tools.mock_tools import ToolDispatcher

def process_intercept_request(
    request: ToolActionRequest,
    db: Session
) -> InterceptorResponse:
    start_time = time.perf_counter()
    
    # 1. Fetch all active policies from database
    active_policies = db.query(SafetyPolicy).filter(SafetyPolicy.is_active == True).all()
    
    # 2. Evaluate through Policy and Risk Engine
    eval_result = PolicyEngine.evaluate(
        action=request.model_dump(),
        active_policies=active_policies
    )
    
    # 3. Determine status and tool execution
    tool_executed = False
    tool_result = None
    approval_id = None
    status = "EVALUATED"

    if eval_result.decision == "ALLOW":
        status = "EXECUTED"
        # Directly dispatch to mock tool safely
        tool_result = ToolDispatcher.dispatch(
            tool_name=request.tool_name,
            operation=request.operation,
            parameters=request.parameters
        )
        tool_executed = True
        
    elif eval_result.decision == "BLOCK":
        status = "BLOCKED"
        tool_executed = False
        tool_result = {
            "status": "BLOCKED_BY_POLICY",
            "message": "Tool execution was prevented by AgentFence safety gateway."
        }
        
    elif eval_result.decision == "REQUIRE_APPROVAL":
        status = "PENDING_APPROVAL"
        tool_executed = False
        tool_result = {
            "status": "HELD_FOR_APPROVAL",
            "message": "Action is quarantined pending human authorization."
        }

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # 4. Record to Audit Log database
    action_log = ActionLog(
        session_id=request.session_id,
        agent_id=request.agent_id,
        agent_role=request.agent_role,
        tool_name=request.tool_name,
        operation=request.operation,
        parameters=request.parameters,
        resource_id=request.resource_id,
        sensitivity_level=request.sensitivity_level,
        is_reversible=request.is_reversible,
        risk_score=eval_result.risk_score,
        risk_level=eval_result.risk_level,
        decision=eval_result.decision,
        explanation=eval_result.explanation,
        triggered_policies=eval_result.triggered_policies,
        latency_ms=latency_ms,
        status=status,
        tool_result=tool_result
    )
    db.add(action_log)
    db.flush()  # obtain action_log.id

    # 5. If REQUIRE_APPROVAL, create pending ApprovalRequest
    if eval_result.decision == "REQUIRE_APPROVAL":
        approval = ApprovalRequest(
            action_id=action_log.id,
            status="PENDING"
        )
        db.add(approval)
        db.flush()
        approval_id = approval.id

    db.commit()

    return InterceptorResponse(
        action_id=action_log.id,
        decision=eval_result.decision,
        risk_score=eval_result.risk_score,
        risk_level=eval_result.risk_level,
        triggered_policies=eval_result.triggered_policies,
        explanation=eval_result.explanation,
        status=status,
        approval_id=approval_id,
        tool_executed=tool_executed,
        tool_result=tool_result,
        latency_ms=latency_ms
    )
