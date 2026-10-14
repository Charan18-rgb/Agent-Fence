from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.action import ActionLog

router = APIRouter(prefix="/audit", tags=["Audit Log & Telemetry"])

@router.get("")
def get_audit_trail(
    decision: Optional[str] = Query(None, description="Filter by ALLOW, REQUIRE_APPROVAL, BLOCK"),
    tool_name: Optional[str] = Query(None, description="Filter by tool name"),
    agent_id: Optional[str] = Query(None, description="Filter by agent id"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Returns the comprehensive audit trail of all evaluated actions,
    along with their risk scores, decisions, policy violations, and execution outcomes.
    """
    query = db.query(ActionLog)

    if decision:
        query = query.filter(ActionLog.decision == decision.upper())
    if tool_name:
        query = query.filter(ActionLog.tool_name == tool_name)
    if agent_id:
        query = query.filter(ActionLog.agent_id == agent_id)
    if status:
        query = query.filter(ActionLog.status == status.upper())

    total = query.count()
    items = query.order_by(ActionLog.timestamp.desc()).offset(offset).limit(limit).all()

    formatted_items = []
    for item in items:
        formatted_items.append({
            "id": item.id,
            "timestamp": item.timestamp.isoformat() if item.timestamp else None,
            "session_id": item.session_id,
            "agent_id": item.agent_id,
            "agent_role": item.agent_role,
            "tool_name": item.tool_name,
            "operation": item.operation,
            "parameters": item.parameters,
            "resource_id": item.resource_id,
            "sensitivity_level": item.sensitivity_level,
            "is_reversible": item.is_reversible,
            "risk_score": item.risk_score,
            "risk_level": item.risk_level,
            "decision": item.decision,
            "explanation": item.explanation,
            "triggered_policies": item.triggered_policies,
            "latency_ms": item.latency_ms,
            "status": item.status,
            "tool_result": item.tool_result,
            "approval_id": item.approval_request.id if item.approval_request else None
        })

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": formatted_items
    }
