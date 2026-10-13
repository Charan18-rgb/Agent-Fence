"""
Default baseline policies seeded into the AgentFence system.
Transparent, deterministic, and modular.
"""

DEFAULT_POLICIES = [
    {
        "id": "POL-SQL-DROP-01",
        "name": "Block Destructive SQL Schema & Data Drops",
        "description": "Strictly prevents execution of DROP, TRUNCATE, or catastrophic schema alterations on any database.",
        "rule_type": "SQL_PROTECTION",
        "severity": "CRITICAL",
        "action_decision": "BLOCK",
        "parameters": {
            "keywords": ["DROP TABLE", "DROP DATABASE", "TRUNCATE TABLE", "DROP SCHEMA"],
            "target_tools": ["database_tool"]
        },
        "is_active": True
    },
    {
        "id": "POL-SQL-PROTECTED-TBL-02",
        "name": "Protect Sensitive Tables from Direct Modification",
        "description": "Requires human approval or blocks operations targeting protected tables (customer_pii, credentials, ledger).",
        "rule_type": "SQL_PROTECTION",
        "severity": "HIGH",
        "action_decision": "BLOCK",
        "parameters": {
            "protected_tables": ["customer_pii", "user_credentials", "financial_ledger", "system_secrets"],
            "target_tools": ["database_tool"]
        },
        "is_active": True
    },
    {
        "id": "POL-DATA-EXFIL-03",
        "name": "Prevent Confidential Data Exfiltration to External Domains",
        "description": "Prohibits dispatching CONFIDENTIAL resources or attachments to email recipients outside verified corporate domains.",
        "rule_type": "DATA_EXFIL",
        "severity": "CRITICAL",
        "action_decision": "BLOCK",
        "parameters": {
            "trusted_domains": ["acmecorp.internal", "company.com", "enterprise.org"],
            "restricted_sensitivities": ["CONFIDENTIAL", "RESTRICTED"],
            "target_tools": ["email_tool"]
        },
        "is_active": True
    },
    {
        "id": "POL-HITL-SENSITIVE-READ-04",
        "name": "Human Approval for Confidential Document & Bulk Export Operations",
        "description": "Flags non-privileged agents accessing CONFIDENTIAL files or triggering irreversible bulk exports.",
        "rule_type": "ACCESS_CONTROL",
        "severity": "MEDIUM",
        "action_decision": "REQUIRE_APPROVAL",
        "parameters": {
            "privileged_roles": ["admin", "compliance_officer", "security_lead"],
            "restricted_sensitivities": ["CONFIDENTIAL"],
            "target_tools": ["document_tool", "file_tool"]
        },
        "is_active": True
    },
    {
        "id": "POL-FILE-DELETE-05",
        "name": "Human Approval for Irreversible File Deletion",
        "description": "Ensures that destructive, non-reversible file deletion operations require explicit human signoff.",
        "rule_type": "DESTRUCTIVE_OP",
        "severity": "HIGH",
        "action_decision": "REQUIRE_APPROVAL",
        "parameters": {
            "operations": ["delete_file", "purge_directory", "format_drive"],
            "target_tools": ["file_tool"]
        },
        "is_active": True
    }
]
