# AgentFence — AI Agent Safety & Control Gateway

> **Problem Statement 2.1 — AI Agent Safety and Control**  
> **Event:** DevHost 2026 — DevHack 2026

AgentFence is a policy-governed safety gateway that monitors, intercepts, and controls operations attempted by AI autonomous agents before those operations reach sensitive enterprise business tools (Databases, File Storage, Mail Transports, and Knowledge Stores).

---

## 1. System Architecture

```
+--------------------------+
|      AI Agent / LLM      |  (Simulator or External Agent)
+--------------------------+
             |
             | 1. Dispatches tool call
             v
+-------------------------------------------------------------+
|               AgentFence Safety Gateway                     |
|                                                             |
|  [Action Interceptor: POST /api/intercept]                  |
|        |                                                    |
|        v                                                    |
|  [Deterministic Policy & Risk Engine]                       |
|        |-- Destructive SQL / DROP Defense (POL-SQL-DROP-01)  |
|        |-- Protected Table Quarantine     (POL-SQL-TBL-02)  |
|        |-- Data Exfiltration Guard        (POL-DATA-EXFIL-03)|
|        |-- HITL Sensitivity Gatekeeper    (POL-HITL-04)     |
|        +-- Irreversible Op Policy         (POL-FILE-05)     |
|        |                                                    |
|        +-----------------+-------------------+              |
|        |                 |                   |              |
|        v                 v                   v              |
|    [ ALLOW ]    [ REQUIRE_APPROVAL ]     [ BLOCK ]          |
|        |                 |                   |              |
|   Direct Safe     Quarantined in       Neutralized          |
|   Execution       HITL Review Queue   Audit Logged          |
+--------|-----------------|-------------------|--------------+
         |                 |                   |
         |         (Human Operator             |
         |          Reviews & Signs Off)       |
         |                 |                   |
         v                 v                   x
+----------------------------------------+
|          Mock Business Tools           |  (Safe Simulated Sandboxes)
|  - Document Store   - Database Query   |
|  - Email Transport  - File System      |
+----------------------------------------+
```

---

## 2. Core Modules & Functionality Implemented

| Module | Status | Description |
| :--- | :---: | :--- |
| **Action Interceptor** | **Implemented** | Synchronously intercepts all agent tool requests via `POST /api/intercept`. Computes risk score, latency, and enforcement decision. |
| **Policy & Risk Engine** | **Implemented** | Fully deterministic, transparent heuristic engine evaluating sensitivity, agent permissions, reversibility, and target domains. |
| **Mock Business Tools** | **Implemented** | Safe simulations for Documents, Database queries, Email sending, and File operations. Blocked actions are strictly prevented from reaching mock tools. |
| **Human Approval (HITL)** | **Implemented** | Holds high-sensitivity actions in quarantine. Operators can inspect parameters, approve to dispatch, or reject. |
| **Audit Log & Telemetry** | **Implemented** | Logging of evaluated requests with measured processing latency, risk tiers, and policy rationale. |
| **Agent Simulator** | **Implemented** | Houses 4 reproducible hackathon benchmark scenarios + live custom action injector. |
| **Frontend Dashboard** | **Implemented** | Modern, responsive React + TypeScript + Tailwind CSS UI with real-time polling and forensic views. |

---

## 3. Benchmark Demonstration Scenarios

1. **Scenario 1: Authorized Document Access (`ALLOW`)**
   - *Agent:* Support Agent
   - *Operation:* Reads public overview documentation.
   - *Result:* Evaluated and allowed; executed safely on mock document tool.
2. **Scenario 2: Confidential Data Exfiltration (`BLOCK`)**
   - *Agent:* Financial Assistant
   - *Operation:* Attempts to email `doc-conf-88` (Customer Financial Ledger) to `exfiltrator@suspicious-external-domain.net`.
   - *Result:* Blocked under `POL-DATA-EXFIL-03` (Risk: 95.0, Critical). Mock tool execution strictly prevented.
3. **Scenario 3: Destructive SQL DROP on Protected Table (`BLOCK`)**
   - *Agent:* Database Assistant
   - *Operation:* Executes `DROP TABLE customer_pii CASCADE;`.
   - *Result:* Blocked under `POL-SQL-DROP-01` & `POL-SQL-PROTECTED-TBL-02` (Risk: 98.0, Critical). Protected table untouched.
4. **Scenario 4: Multi-Step Suspicious Sequence (`REQUIRE_APPROVAL`)**
   - *Step 1:* General search (`ALLOW`).
   - *Step 2:* Non-privileged read of confidential M&A doc (`REQUIRE_APPROVAL`).
   - *Step 3:* Irreversible file deletion (`REQUIRE_APPROVAL`).
   - *Result:* Quarantined into Human Approval Queue.

---

## 4. Test Results & Measured Metrics

Tests executed via `pytest`:
- **Total Test Cases:** 17 / 17 Passing.
- **Observed Behavior on Test Scenarios:**
  - Valid safe actions in the test suite are evaluated and allowed.
  - Known malicious and destructive test cases (SQL schema drops, external exfiltration, unregistered tools) are blocked prior to tool invocation.
  - Quarantined approval actions remain pending until an operator explicitly approves or rejects them.
  - Approved actions execute using the originally submitted action parameters without modification.
  - Actions cannot be approved or rejected more than once.
- **Measured Evaluation Latency:** Between ~0.5 ms and ~2.5 ms per evaluation during test runs.
- **Frontend Production Build:** Verified via Vite TypeScript compiler (`tsc -b && vite build`) with 0 errors.

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js 18+ and npm (tested with Node v24, npm 11)

### Backend (Python & FastAPI)
```bash
cd backend
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start FastAPI Gateway server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API interactive documentation available at: `http://127.0.0.1:8000/docs`

### Frontend (React, TypeScript, Tailwind)
```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Current Limitations & Scope
- **Deterministic Heuristic Rules:** The gateway relies strictly on transparent heuristic matching (table protection lists, domain whitelists, sensitive keyword dictionaries). It does not claim complete protection against sophisticated prompt injection attacks or novel obfuscation techniques.
- **Mock Business Tools:** Business tools are simulated in-memory sandboxes for safe local evaluation without requiring live external databases or SMTP servers.
- **Authentication:** In the current MVP, approval reviews accept the reviewer name as a parameter without enforcing an external identity provider or enterprise SSO (e.g. OAuth2/OIDC). Multi-tenant auth remains planned for future versions.
