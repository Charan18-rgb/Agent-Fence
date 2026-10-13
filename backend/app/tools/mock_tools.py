"""
Mock business tools for safe simulation in AgentFence.
None of these tools execute real destructive actions, write real files,
or send real emails. They return structured simulation outcomes.
"""

from typing import Any

class MockDocumentTool:
    """Simulates enterprise document knowledge base queries and reads."""
    
    _DOCUMENTS = {
        "doc-pub-01": {"title": "Company Overview & Mission", "sensitivity": "PUBLIC", "content": "Welcome to Acme Corp..."},
        "doc-pub-02": {"title": "Public Product Release Notes", "sensitivity": "PUBLIC", "content": "Version 3.2 includes bugfixes..."},
        "doc-int-10": {"title": "Employee Handbook & Benefits", "sensitivity": "INTERNAL", "content": "Internal policies on PTO, insurance..."},
        "doc-int-11": {"title": "Engineering Best Practices", "sensitivity": "INTERNAL", "content": "Code review standards and PR guidelines..."},
        "doc-conf-99": {"title": "Q4 Merger & Acquisition Strategy", "sensitivity": "CONFIDENTIAL", "content": "Strictly confidential: Target valuation $50M..."},
        "doc-conf-88": {"title": "Customer Financial Ledger 2026", "sensitivity": "CONFIDENTIAL", "content": "SSN, IBAN and account balances of key clients..."}
    }

    @classmethod
    def execute(cls, operation: str, parameters: dict[str, Any]) -> dict[str, Any]:
        doc_id = parameters.get("document_id") or parameters.get("resource_id", "doc-pub-01")
        if operation == "search_documents":
            query = parameters.get("query", "").lower()
            results = [
                {"id": k, "title": v["title"], "sensitivity": v["sensitivity"]}
                for k, v in cls._DOCUMENTS.items()
                if query in v["title"].lower() or query in v["content"].lower()
            ]
            return {"status": "SUCCESS", "operation": operation, "count": len(results), "documents": results}
        
        elif operation == "read_document":
            doc = cls._DOCUMENTS.get(doc_id)
            if not doc:
                return {"status": "NOT_FOUND", "operation": operation, "error": f"Document {doc_id} not found."}
            return {
                "status": "SUCCESS",
                "operation": operation,
                "document_id": doc_id,
                "title": doc["title"],
                "sensitivity": doc["sensitivity"],
                "content_preview": doc["content"][:60] + "..."
            }
        
        return {"status": "UNKNOWN_OPERATION", "operation": operation}


class MockDatabaseTool:
    """Simulates SQL database query and mutation execution."""
    
    @classmethod
    def execute(cls, operation: str, parameters: dict[str, Any]) -> dict[str, Any]:
        query = parameters.get("query", "")
        table = parameters.get("table", "general_records")
        
        # Note: At tool level, if interceptor allowed it, it runs safely in sandbox
        return {
            "status": "SUCCESS",
            "operation": operation,
            "simulated_execution": True,
            "target_table": table,
            "query_executed": query,
            "rows_affected": 1 if "UPDATE" in query.upper() or "INSERT" in query.upper() else 10,
            "output": f"Simulated execution of [{operation}] on table [{table}] completed safely."
        }


class MockEmailTool:
    """Simulates enterprise email dispatching without contacting real SMTP servers."""
    
    @classmethod
    def execute(cls, operation: str, parameters: dict[str, Any]) -> dict[str, Any]:
        recipient = parameters.get("recipient", "")
        subject = parameters.get("subject", "")
        attachment_count = len(parameters.get("attachment_ids", []))
        
        return {
            "status": "SUCCESS",
            "operation": operation,
            "simulated_dispatch": True,
            "recipient": recipient,
            "subject": subject,
            "attachments_delivered": attachment_count,
            "output": f"Simulated email sent to {recipient} with {attachment_count} attachments."
        }


class MockFileTool:
    """Simulates file system modifications and storage actions."""
    
    @classmethod
    def execute(cls, operation: str, parameters: dict[str, Any]) -> dict[str, Any]:
        file_path = parameters.get("path", "/sandbox/data.txt")
        action = operation
        
        return {
            "status": "SUCCESS",
            "operation": action,
            "simulated_filesystem": True,
            "target_path": file_path,
            "output": f"Simulated file operation [{action}] on path [{file_path}] completed safely in sandbox."
        }


class ToolDispatcher:
    """Routes intercepted and approved actions to the appropriate mock tool."""
    
    _TOOLS = {
        "document_tool": MockDocumentTool,
        "database_tool": MockDatabaseTool,
        "email_tool": MockEmailTool,
        "file_tool": MockFileTool,
    }

    @classmethod
    def dispatch(cls, tool_name: str, operation: str, parameters: dict[str, Any]) -> dict[str, Any]:
        tool_cls = cls._TOOLS.get(tool_name)
        if not tool_cls:
            return {
                "status": "ERROR",
                "error": f"Tool '{tool_name}' is not registered with ToolDispatcher."
            }
        return tool_cls.execute(operation, parameters)
