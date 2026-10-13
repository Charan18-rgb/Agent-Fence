"""
Deterministic Risk and Safety Policy Engine for AgentFence.
Evaluates agent permissions, destination trust, SQL commands, resource sensitivity,
and reversibility without relying on stochastic, opaque models.
"""

from typing import Any
from app.models.action import SafetyPolicy
from app.config import settings

class EvaluationResult:
    def __init__(
        self,
        decision: str,  # ALLOW, REQUIRE_APPROVAL, BLOCK
        risk_score: float,  # 0.0 to 100.0
        risk_level: str,  # LOW, MEDIUM, HIGH, CRITICAL
        triggered_policies: list[str],
        explanation: str
    ):
        self.decision = decision
        self.risk_score = risk_score
        self.risk_level = risk_level
        self.triggered_policies = triggered_policies
        self.explanation = explanation


class PolicyEngine:
    @staticmethod
    def evaluate(
        action: dict[str, Any],
        active_policies: list[SafetyPolicy]
    ) -> EvaluationResult:
        """
        Evaluates a tool action request against active safety policies and deterministic heuristics.
        
        Action dictionary contains:
        - agent_id: str
        - agent_role: str
        - tool_name: str
        - operation: str
        - parameters: dict
        - resource_id: str (optional)
        - sensitivity_level: str (PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL)
        - is_reversible: bool
        """
        tool_name = action.get("tool_name", "")
        operation = action.get("operation", "")
        parameters = action.get("parameters", {})
        sensitivity = action.get("sensitivity_level", "INTERNAL").upper()
        agent_role = action.get("agent_role", "standard_agent").lower()
        is_reversible = action.get("is_reversible", True)
        
        triggered_policies = []
        violations = []
        highest_decision = "ALLOW"
        calculated_risk = 5.0  # Base nominal risk for any automated action

        # Map policies by id for quick lookup
        policy_map = {p.id: p for p in active_policies if p.is_active}

        # --- RULE 1: Destructive SQL & Drop Protection ---
        if tool_name == "database_tool":
            query = str(parameters.get("query", "")).upper()
            table = str(parameters.get("table", "")).lower()
            
            # Check destructive keywords
            sql_drop_policy = policy_map.get("POL-SQL-DROP-01")
            if sql_drop_policy:
                keywords = sql_drop_policy.parameters.get("keywords", ["DROP TABLE", "TRUNCATE"])
                if any(kw in query for kw in keywords):
                    triggered_policies.append(f"{sql_drop_policy.id}: {sql_drop_policy.name}")
                    violations.append(f"SQL statement contains destructive command targeting schema deletion ({query}).")
                    highest_decision = "BLOCK"
                    calculated_risk = max(calculated_risk, 98.0)

            # Check protected tables
            sql_table_policy = policy_map.get("POL-SQL-PROTECTED-TBL-02")
            if sql_table_policy and highest_decision != "BLOCK":
                protected = sql_table_policy.parameters.get("protected_tables", settings.PROTECTED_TABLES)
                if table in protected or any(pt in query.lower() for pt in protected):
                    # If it's a mutation (INSERT, UPDATE, DELETE) or unauthorized access
                    if any(verb in query for verb in ["DELETE", "UPDATE", "INSERT", "DROP", "ALTER"]) or operation in ["delete", "modify"]:
                        triggered_policies.append(f"{sql_table_policy.id}: {sql_table_policy.name}")
                        violations.append(f"Operation targets protected database table '{table}' with modification query.")
                        highest_decision = "BLOCK"
                        calculated_risk = max(calculated_risk, 92.0)
                    elif sensitivity in ["RESTRICTED", "CONFIDENTIAL"] and agent_role not in ["dba", "admin", "data_owner"]:
                        triggered_policies.append(f"{sql_table_policy.id}: {sql_table_policy.name}")
                        violations.append(f"Query reads protected table '{table}' containing high-sensitivity records.")
                        if highest_decision != "BLOCK":
                            highest_decision = "REQUIRE_APPROVAL"
                        calculated_risk = max(calculated_risk, 75.0)

        # --- RULE 2: Data Exfiltration via Email ---
        if tool_name == "email_tool":
            recipient = str(parameters.get("recipient", "")).lower()
            exfil_policy = policy_map.get("POL-DATA-EXFIL-03")
            
            if exfil_policy:
                trusted_domains = [d.lower() for d in exfil_policy.parameters.get("trusted_domains", settings.TRUSTED_DOMAINS)]
                restricted_sensitivities = exfil_policy.parameters.get("restricted_sensitivities", ["CONFIDENTIAL", "RESTRICTED"])
                
                # Check domain
                recipient_domain = recipient.split("@")[-1] if "@" in recipient else ""
                is_external = recipient_domain not in trusted_domains
                
                if is_external and sensitivity in restricted_sensitivities:
                    triggered_policies.append(f"{exfil_policy.id}: {exfil_policy.name}")
                    violations.append(f"Attempted email transmission of {sensitivity} data to untrusted external recipient domain '@{recipient_domain}'.")
                    highest_decision = "BLOCK"
                    calculated_risk = max(calculated_risk, 95.0)
                elif is_external and sensitivity == "INTERNAL":
                    # Sharing internal data outside requires sign-off
                    triggered_policies.append(f"{exfil_policy.id}: External dispatch of internal asset")
                    violations.append(f"Dispatch of internal data to external recipient '@{recipient_domain}' requires human review.")
                    if highest_decision != "BLOCK":
                        highest_decision = "REQUIRE_APPROVAL"
                    calculated_risk = max(calculated_risk, 65.0)

        # --- RULE 3: Access Control & Sensitive Document Inspection ---
        if tool_name in ["document_tool", "file_tool"]:
            access_policy = policy_map.get("POL-HITL-SENSITIVE-READ-04")
            if access_policy and sensitivity == "CONFIDENTIAL":
                privileged_roles = access_policy.parameters.get("privileged_roles", ["admin", "security_lead"])
                if agent_role not in privileged_roles:
                    triggered_policies.append(f"{access_policy.id}: {access_policy.name}")
                    violations.append(f"Role '{agent_role}' attempted access to CONFIDENTIAL asset without pre-cleared privilege.")
                    if highest_decision != "BLOCK":
                        highest_decision = "REQUIRE_APPROVAL"
                    calculated_risk = max(calculated_risk, 70.0)

        # --- RULE 4: Destructive / Non-reversible File Operations ---
        if tool_name == "file_tool":
            file_policy = policy_map.get("POL-FILE-DELETE-05")
            destructive_ops = file_policy.parameters.get("operations", ["delete_file", "purge_directory"]) if file_policy else ["delete_file"]
            
            if (operation in destructive_ops or not is_reversible) and file_policy:
                triggered_policies.append(f"{file_policy.id}: {file_policy.name}")
                violations.append(f"Irreversible file operation '{operation}' on system storage.")
                if highest_decision != "BLOCK":
                    highest_decision = "REQUIRE_APPROVAL"
                calculated_risk = max(calculated_risk, 68.0)

        # --- Sensitivity and Reversibility Baseline Weighting ---
        if sensitivity == "PUBLIC":
            calculated_risk = min(calculated_risk, 15.0) if highest_decision == "ALLOW" else calculated_risk
        elif sensitivity == "INTERNAL" and highest_decision == "ALLOW":
            calculated_risk = max(calculated_risk, 20.0)
        elif sensitivity == "RESTRICTED" and highest_decision == "ALLOW":
            calculated_risk = max(calculated_risk, 45.0)
        elif sensitivity == "CONFIDENTIAL" and highest_decision == "ALLOW":
            calculated_risk = max(calculated_risk, 60.0)

        if not is_reversible and highest_decision == "ALLOW":
            calculated_risk += 15.0

        # Synthesize Risk Level
        if calculated_risk >= 85.0:
            risk_level = "CRITICAL"
        elif calculated_risk >= 60.0:
            risk_level = "HIGH"
        elif calculated_risk >= 35.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate Human-Readable Explanation
        if highest_decision == "BLOCK":
            explanation = "BLOCKED: " + " | ".join(violations)
        elif highest_decision == "REQUIRE_APPROVAL":
            explanation = "APPROVAL REQUIRED: " + " | ".join(violations)
        else:
            explanation = f"ALLOWED: Operation '{operation}' on '{tool_name}' verified safe within policy constraints (Sensitivity: {sensitivity})."

        return EvaluationResult(
            decision=highest_decision,
            risk_score=round(calculated_risk, 1),
            risk_level=risk_level,
            triggered_policies=triggered_policies,
            explanation=explanation
        )
