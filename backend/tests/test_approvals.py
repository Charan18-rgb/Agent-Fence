def test_approval_workflow_approve(client):
    # 1. Trigger an action requiring approval
    intercept_payload = {
        "agent_id": "agent-contractor-03",
        "agent_role": "contractor",
        "tool_name": "document_tool",
        "operation": "read_document",
        "parameters": {"document_id": "doc-conf-99"},
        "resource_id": "doc-conf-99",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": True
    }
    intercept_res = client.post("/api/intercept", json=intercept_payload)
    assert intercept_res.status_code == 200
    approval_id = intercept_res.json()["approval_id"]
    assert approval_id is not None

    # 2. Check pending approvals list
    list_res = client.get("/api/approvals")
    assert list_res.status_code == 200
    pending_items = list_res.json()
    assert any(item["id"] == approval_id for item in pending_items)

    # 3. Review and APPROVE
    review_payload = {
        "decision": "APPROVED",
        "reviewer": "security_admin_alice",
        "reason": "Authorized for quarterly compliance check."
    }
    approve_res = client.post(f"/api/approvals/{approval_id}/review", json=review_payload)
    assert approve_res.status_code == 200
    approve_data = approve_res.json()
    assert approve_data["decision"] == "APPROVED"
    assert approve_data["action_status"] == "APPROVED_AND_EXECUTED"
    assert approve_data["tool_result"]["status"] == "SUCCESS"

    # 4. Confirm it's no longer in pending queue
    list_res_after = client.get("/api/approvals")
    assert not any(item["id"] == approval_id for item in list_res_after.json())

def test_approval_workflow_reject(client):
    intercept_payload = {
        "agent_id": "agent-untrusted-05",
        "agent_role": "intern",
        "tool_name": "file_tool",
        "operation": "delete_file",
        "parameters": {"path": "/shared/reports/q1.pdf"},
        "resource_id": "file-q1",
        "sensitivity_level": "INTERNAL",
        "is_reversible": False
    }
    intercept_res = client.post("/api/intercept", json=intercept_payload)
    approval_id = intercept_res.json()["approval_id"]
    assert approval_id is not None

    reject_payload = {
        "decision": "REJECTED",
        "reviewer": "security_admin_bob",
        "reason": "Unauthorized file deletion attempt."
    }
    reject_res = client.post(f"/api/approvals/{approval_id}/review", json=reject_payload)
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["decision"] == "REJECTED"
    assert data["action_status"] == "REJECTED_BY_HUMAN"
    assert data["tool_result"]["status"] == "REJECTED_BY_HUMAN"

def test_approval_cannot_be_reviewed_twice(client):
    intercept_payload = {
        "agent_id": "agent-contractor-04",
        "agent_role": "contractor",
        "tool_name": "document_tool",
        "operation": "read_document",
        "parameters": {"document_id": "doc-conf-99"},
        "resource_id": "doc-conf-99",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": True
    }
    res = client.post("/api/intercept", json=intercept_payload)
    approval_id = res.json()["approval_id"]

    # First review
    first_review = client.post(
        f"/api/approvals/{approval_id}/review",
        json={"decision": "APPROVED", "reviewer": "admin_alice"}
    )
    assert first_review.status_code == 200

    # Second review attempt must fail with 400
    second_review = client.post(
        f"/api/approvals/{approval_id}/review",
        json={"decision": "APPROVED", "reviewer": "admin_eve"}
    )
    assert second_review.status_code == 400
    assert "already been processed" in second_review.json()["detail"].lower()

def test_approval_executes_only_originally_reviewed_action(client):
    original_params = {"document_id": "doc-conf-99"}
    intercept_payload = {
        "agent_id": "agent-contractor-05",
        "agent_role": "contractor",
        "tool_name": "document_tool",
        "operation": "read_document",
        "parameters": original_params,
        "resource_id": "doc-conf-99",
        "sensitivity_level": "CONFIDENTIAL",
        "is_reversible": True
    }
    res = client.post("/api/intercept", json=intercept_payload)
    approval_id = res.json()["approval_id"]

    # Approve
    review_res = client.post(
        f"/api/approvals/{approval_id}/review",
        json={"decision": "APPROVED", "reviewer": "admin_carol", "reason": "Verified audit"}
    )
    assert review_res.status_code == 200
    result_data = review_res.json()
    assert result_data["tool_result"]["document_id"] == "doc-conf-99"
