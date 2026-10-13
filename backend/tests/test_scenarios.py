def test_run_scenario_1_authorized(client):
    res = client.post("/api/simulator/run/scenario_1_authorized_doc_read")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "scenario_1_authorized_doc_read"
    assert len(data["results"]) == 1
    assert data["results"][0]["decision"] == "ALLOW"
    assert data["results"][0]["tool_executed"] is True

def test_run_scenario_2_exfiltration(client):
    res = client.post("/api/simulator/run/scenario_2_confidential_data_exfil")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "scenario_2_confidential_data_exfil"
    assert len(data["results"]) == 1
    assert data["results"][0]["decision"] == "BLOCK"
    assert data["results"][0]["tool_executed"] is False

def test_run_scenario_3_drop_table(client):
    res = client.post("/api/simulator/run/scenario_3_drop_protected_table")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "scenario_3_drop_protected_table"
    assert len(data["results"]) == 1
    assert data["results"][0]["decision"] == "BLOCK"
    assert data["results"][0]["tool_executed"] is False

def test_run_scenario_4_suspicious_sequence(client):
    res = client.post("/api/simulator/run/scenario_4_suspicious_sequence")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "scenario_4_suspicious_sequence"
    assert len(data["results"]) == 3
    # Step 1: doc search -> ALLOW
    assert data["results"][0]["decision"] == "ALLOW"
    # Step 2: doc-conf-99 read by non-privileged agent -> REQUIRE_APPROVAL
    assert data["results"][1]["decision"] == "REQUIRE_APPROVAL"
    # Step 3: irreversible delete_file -> REQUIRE_APPROVAL
    assert data["results"][2]["decision"] == "REQUIRE_APPROVAL"

def test_policy_toggle_modifies_interceptor_decisions(client):
    # Verify exfiltration is BLOCKED initially
    exfil_payload = {
        "agent_id": "agent-toggle-test",
        "agent_role": "analyst",
        "tool_name": "email_tool",
        "operation": "send_email",
        "parameters": {
            "recipient": "external@untrusted-domain.com",
            "attachment_ids": ["doc-conf-88"]
        },
        "resource_id": "doc-conf-88",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": False
    }
    r1 = client.post("/api/intercept", json=exfil_payload)
    assert r1.status_code == 200
    assert r1.json()["decision"] == "BLOCK"

    # Disable POL-DATA-EXFIL-03 policy
    toggle_res = client.patch(
        "/api/policies/POL-DATA-EXFIL-03/toggle",
        json={"is_active": False}
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # Intercept again with policy disabled -> decision will no longer be BLOCK by that policy
    r2 = client.post("/api/intercept", json=exfil_payload)
    assert r2.status_code == 200
    assert r2.json()["decision"] != "BLOCK"

    # Restore policy to active state
    restore_res = client.patch(
        "/api/policies/POL-DATA-EXFIL-03/toggle",
        json={"is_active": True}
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["is_active"] is True

def test_metrics_and_telemetry_accuracy(client):
    res = client.get("/api/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_actions"] > 0
    assert 0 <= stats["allow_rate"] <= 100
    assert 0 <= stats["block_rate"] <= 100
    assert 0 <= stats["approval_rate"] <= 100
    # Verification of evaluation latency
    assert stats["mean_latency_ms"] >= 0.0
