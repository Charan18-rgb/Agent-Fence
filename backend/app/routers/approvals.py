from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.action import ActionLog, ApprovalRequest
from app.schemas.action import ApprovalDecisionRequest, ApprovalResponse
from app.tools.mock_tools import ToolDispatcher

router = APIRouter(prefix="/approvals", tags=["Human Approval Workflow"])

@router.get("", response_model=list[dict])
def list_pending_approvals(db: Session = Depends(get_db)):
    """Fetches all actions currently quarantined in the Human-in-the-Loop approval queue."""
    pending = (
        db.query(ApprovalRequest)
        .filter(ApprovalRequest.status == "PENDING")
        .order_by(ApprovalRequest.created_at.desc())
        .all()
    )
    
    results = []
    for item in pending:
        results.append({
            "id": item.id,
            "action_id": item.action_id,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "status": item.status,
            "agent_id": item.action_log.agent_id if item.action_log else None,
            "agent_role": item.action_log.agent_role if item.action_log else None,
            "tool_name": item.action_log.tool_name if item.action_log else None,
            "operation": item.action_log.operation if item.action_log else None,
            "parameters": item.action_log.parameters if item.action_log else {},
            "resource_id": item.action_log.resource_id if item.action_log else None,
            "sensitivity_level": item.action_log.sensitivity_level if item.action_log else None,
            "risk_score": item.action_log.risk_score if item.action_log else 0.0,
            "risk_level": item.action_log.risk_level if item.action_log else "MEDIUM",
            "explanation": item.action_log.explanation if item.action_log else "",
            "triggered_policies": item.action_log.triggered_policies if item.action_log else []
        })
    return results


@router.post("/{approval_id}/review")
def review_approval_request(
    approval_id: str,
    review_req: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Submits a human approval or rejection decision.
    If APPROVED, the pending action is released and executed safely via the target mock tool.
    If REJECTED, tool execution is blocked and audit record updated.
    """
    approval = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")
        
    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request has already been processed as {approval.status}.")

    decision_norm = review_req.decision.upper()
    if decision_norm not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVED' or 'REJECTED'.")

    now = datetime.now(timezone.utc)
    approval.status = decision_norm
    approval.reviewed_by = review_req.reviewer
    approval.reviewed_at = now
    approval.review_notes = review_req.reason

    action_log = approval.action_log
    
    if decision_norm == "APPROVED":
        # Safe execution of the approved tool action
        tool_result = ToolDispatcher.dispatch(
            tool_name=action_log.tool_name,
            operation=action_log.operation,
            parameters=action_log.parameters
        )
        action_log.status = "APPROVED_AND_EXECUTED"
        action_log.tool_result = tool_result
    else:
        action_log.status = "REJECTED_BY_HUMAN"
        action_log.tool_result = {
            "status": "REJECTED_BY_HUMAN",
            "message": f"Rejected by reviewer {review_req.reviewer}: {review_req.reason or 'No reason provided.'}"
        }

    db.commit()

    return {
        "status": "SUCCESS",
        "approval_id": approval.id,
        "action_id": action_log.id,
        "decision": decision_norm,
        "action_status": action_log.status,
        "tool_result": action_log.tool_result
    }
