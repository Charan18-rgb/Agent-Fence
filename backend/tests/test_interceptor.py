def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_interceptor_allow_safe_document_read(client):
    payload = {
        "agent_id": "agent-support-01",
        "agent_role": "customer_support",
        "tool_name": "document_tool",
        "operation": "read_document",
        "parameters": {"document_id": "doc-pub-01"},
        "resource_id": "doc-pub-01",
        "sensitivity_level": "PUBLIC",
        "is_reversible": True
    }
    response = client.post("/api/intercept", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "ALLOW"
    assert data["tool_executed"] is True
    assert data["status"] == "EXECUTED"
    assert data["tool_result"]["status"] == "SUCCESS"
    assert data["risk_score"] <= 20.0
    assert data["latency_ms"] >= 0

def test_interceptor_block_confidential_email_exfiltration(client):
    payload = {
        "agent_id": "agent-analyst-99",
        "agent_role": "financial_assistant",
        "tool_name": "email_tool",
        "operation": "send_email",
        "parameters": {
            "recipient": "exfiltrator@suspicious-external-domain.net",
            "subject": "Confidential Ledger",
            "attachment_ids": ["doc-conf-88"]
        },
        "resource_id": "doc-conf-88",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": False
    }
    response = client.post("/api/intercept", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "BLOCK"
    assert data["tool_executed"] is False
    assert data["status"] == "BLOCKED"
    assert "exfiltrate" in data["explanation"].lower() or "external" in data["explanation"].lower()
    assert data["risk_score"] >= 90.0

def test_interceptor_block_drop_table(client):
    payload = {
        "agent_id": "agent-devops-02",
        "agent_role": "database_assistant",
        "tool_name": "database_tool",
        "operation": "execute_query",
        "parameters": {
            "query": "DROP TABLE customer_pii CASCADE;",
            "table": "customer_pii"
        },
        "resource_id": "table-customer_pii",
        "sensitivity_level": "RESTRICTED",
        "is_reversible": False
    }
    response = client.post("/api/intercept", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "BLOCK"
    assert data["tool_executed"] is False
    assert data["status"] == "BLOCKED"
    assert "schema deletion" in data["explanation"].lower() or "destructive" in data["explanation"].lower()

def test_interceptor_require_approval_sensitive_access(client):
    payload = {
        "agent_id": "agent-recon-07",
        "agent_role": "general_assistant",
        "tool_name": "document_tool",
        "operation": "read_document",
        "parameters": {"document_id": "doc-conf-99"},
        "resource_id": "doc-conf-99",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": True
    }
    response = client.post("/api/intercept", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "REQUIRE_APPROVAL"
    assert data["tool_executed"] is False
    assert data["status"] == "PENDING_APPROVAL"
    assert data["approval_id"] is not None
