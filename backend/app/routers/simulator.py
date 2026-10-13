import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.simulator.scenarios import SCENARIOS
from app.schemas.action import ToolActionRequest, InterceptorResponse
from app.engine.interceptor_service import process_intercept_request

router = APIRouter(prefix="/simulator", tags=["Agent Simulator"])

@router.get("/scenarios")
def list_scenarios():
    """Lists pre-configured reproducible simulation scenarios."""
    return SCENARIOS

@router.post("/run/{scenario_id}")
def run_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """
    Executes a specific deterministic scenario step-by-step through the safety interceptor gateway.
    Returns the evaluated actions, risk metrics, and gateway decisions.
    """
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    session_id = f"sim-{scenario_id}-{uuid.uuid4().hex[:6]}"
    step_results: list[dict[str, Any]] = []

    for idx, act_def in enumerate(scenario["actions"], start=1):
        req = ToolActionRequest(
            agent_id=act_def["agent_id"],
            agent_role=act_def["agent_role"],
            tool_name=act_def["tool_name"],
            operation=act_def["operation"],
            parameters=act_def["parameters"],
            resource_id=act_def.get("resource_id"),
            sensitivity_level=act_def.get("sensitivity_level", "INTERNAL"),
            is_reversible=act_def.get("is_reversible", True),
            session_id=session_id
        )
        
        interceptor_resp: InterceptorResponse = process_intercept_request(req, db)
        step_results.append({
            "step": idx,
            "agent_id": req.agent_id,
            "tool_name": req.tool_name,
            "operation": req.operation,
            "decision": interceptor_resp.decision,
            "risk_score": interceptor_resp.risk_score,
            "risk_level": interceptor_resp.risk_level,
            "triggered_policies": interceptor_resp.triggered_policies,
            "explanation": interceptor_resp.explanation,
            "status": interceptor_resp.status,
            "approval_id": interceptor_resp.approval_id,
            "tool_executed": interceptor_resp.tool_executed,
            "tool_result": interceptor_resp.tool_result,
            "latency_ms": interceptor_resp.latency_ms
        })

    return {
        "scenario_id": scenario["id"],
        "scenario_name": scenario["name"],
        "category": scenario["category"],
        "session_id": session_id,
        "total_steps": len(step_results),
        "results": step_results
    }
