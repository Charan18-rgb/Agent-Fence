from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.action import SafetyPolicy
from app.schemas.action import SafetyPolicySchema, PolicyToggleRequest

router = APIRouter(prefix="/policies", tags=["Policy Management"])

@router.get("", response_model=list[SafetyPolicySchema])
def list_policies(db: Session = Depends(get_db)):
    """Lists all configured safety policies and their activation status."""
    return db.query(SafetyPolicy).order_by(SafetyPolicy.id).all()

@router.patch("/{policy_id}/toggle")
def toggle_policy(
    policy_id: str,
    toggle_req: PolicyToggleRequest,
    db: Session = Depends(get_db)
):
    """Enable or disable a specific safety policy."""
    policy = db.query(SafetyPolicy).filter(SafetyPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    
    policy.is_active = toggle_req.is_active
    db.commit()
    db.refresh(policy)
    return {
        "status": "SUCCESS",
        "policy_id": policy.id,
        "name": policy.name,
        "is_active": policy.is_active
    }
