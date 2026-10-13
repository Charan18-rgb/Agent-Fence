from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.action import ToolActionRequest, InterceptorResponse
from app.engine.interceptor_service import process_intercept_request

router = APIRouter(prefix="/intercept", tags=["Action Interceptor"])

@router.post("", response_model=InterceptorResponse)
def intercept_action(request: ToolActionRequest, db: Session = Depends(get_db)):
    """
    Every tool action requested by an AI agent must pass through this safety gateway endpoint.
    It evaluates policies, assesses risk, records the audit log, and decides whether to
    ALLOW, REQUIRE_APPROVAL, or BLOCK the operation.
    """
    return process_intercept_request(request, db)
