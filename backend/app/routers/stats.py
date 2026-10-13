from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.action import ActionLog, ApprovalRequest
from app.schemas.action import DashboardStats

router = APIRouter(prefix="/stats", tags=["Metrics & Observability"])

@router.get("", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes system-wide performance and safety telemetry:
    - Total actions evaluated
    - Safe-action allowance rate
    - Unsafe-action blocking rate
    - Human-approval rate
    - Evaluation latency (mean in milliseconds)
    - Risk & tool distributions
    """
    total = db.query(ActionLog).count()
    if total == 0:
        return DashboardStats(
            total_actions=0,
            allowed_count=0,
            require_approval_count=0,
            blocked_count=0,
            executed_count=0,
            allow_rate=0.0,
            block_rate=0.0,
            approval_rate=0.0,
            mean_latency_ms=0.0,
            risk_distribution={"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            tool_distribution={}
        )

    allowed = db.query(ActionLog).filter(ActionLog.decision == "ALLOW").count()
    approvals = db.query(ActionLog).filter(ActionLog.decision == "REQUIRE_APPROVAL").count()
    blocked = db.query(ActionLog).filter(ActionLog.decision == "BLOCK").count()
    executed = db.query(ActionLog).filter(ActionLog.status.in_(["EXECUTED", "APPROVED_AND_EXECUTED"])).count()
    
    # Latency mean
    mean_latency = db.query(func.avg(ActionLog.latency_ms)).scalar() or 0.0

    # Risk level distribution
    risk_counts = dict(db.query(ActionLog.risk_level, func.count(ActionLog.id)).group_by(ActionLog.risk_level).all())
    risk_distribution = {
        "LOW": risk_counts.get("LOW", 0),
        "MEDIUM": risk_counts.get("MEDIUM", 0),
        "HIGH": risk_counts.get("HIGH", 0),
        "CRITICAL": risk_counts.get("CRITICAL", 0)
    }

    # Tool distribution
    tool_counts = dict(db.query(ActionLog.tool_name, func.count(ActionLog.id)).group_by(ActionLog.tool_name).all())

    return DashboardStats(
        total_actions=total,
        allowed_count=allowed,
        require_approval_count=approvals,
        blocked_count=blocked,
        executed_count=executed,
        allow_rate=round((allowed / total) * 100, 1),
        block_rate=round((blocked / total) * 100, 1),
        approval_rate=round((approvals / total) * 100, 1),
        mean_latency_ms=round(float(mean_latency), 2),
        risk_distribution=risk_distribution,
        tool_distribution=tool_counts
    )
