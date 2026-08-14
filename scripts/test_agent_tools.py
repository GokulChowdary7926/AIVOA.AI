#!/usr/bin/env python3
"""
Verification suite for AIVOA Copilot Agent Tool Orchestration:
- log_complaint
- document_extraction → log_complaint
- edit_complaint
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database import SessionLocal, engine, Base  # noqa: E402
from app.ai.agent import process_copilot_request  # noqa: E402


def run_agent_tool_tests():
    print("=========================================================")
    print("AIVOA.AI — AGENT TOOL ORCHESTRATION TEST SUITE")
    print("=========================================================\n")

    # Initialize test DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # TEST 1: Pastes text + "please log this complaint" -> invokes log_complaint
        print("[TEST 1] Pasting text + 'please log this complaint' (Tool: log_complaint)...")
        text_input = "Received customer report from St. Jude Children's Hospital. Paclitaxel Injection 6mg/mL (Batch #AZ-9041) showed visible glass specks. Date: 2026-08-10. Please log this complaint."
        
        res1 = process_copilot_request(
            message=text_input,
            db=db
        )

        assert res1.get("tool_invoked") == "log_complaint", f"FAIL: Expected tool 'log_complaint', got '{res1.get('tool_invoked')}'"
        c1 = res1.get("active_complaint")
        assert c1 is not None, "FAIL: Expected active_complaint object"
        assert c1.get("batch_number") == "AZ-9041", f"FAIL: Expected batch AZ-9041, got {c1.get('batch_number')}"
        assert c1.get("severity") in ["High", "Critical"], f"FAIL: Expected High/Critical severity, got {c1.get('severity')}"
        print(f"✓ PASS: log_complaint invoked successfully! Logged Complaint #{c1['id'][:8]} (Product={c1['product_name']}, Batch={c1['batch_number']})\n")

        # TEST 2: Uploads PDF/email -> invokes document_extraction → log_complaint
        print("[TEST 2] Uploading PDF/Email document (Tool: document_extraction → log_complaint)...")
        sample_email_bytes = b"Quality Alert: CVS Health Pharmacy reports Amoxicillin 500mg Capsules Batch #TB-4412 assay potency at 82.4%. Subpotency OOS reported on 2026-08-08."
        
        res2 = process_copilot_request(
            message="Uploaded document file",
            db=db,
            file_bytes=sample_email_bytes,
            filename="complaint_notice.eml"
        )

        assert res2.get("tool_invoked") == "document_extraction → log_complaint", f"FAIL: Expected tool 'document_extraction → log_complaint', got '{res2.get('tool_invoked')}'"
        c2 = res2.get("active_complaint")
        assert c2 is not None, "FAIL: Expected active_complaint object"
        assert c2.get("batch_number") == "TB-4412", f"FAIL: Expected batch TB-4412, got {c2.get('batch_number')}"
        print(f"✓ PASS: document_extraction → log_complaint invoked successfully! Logged Complaint #{c2['id'][:8]} from file (Batch={c2['batch_number']})\n")

        # TEST 3: "Sorry, the batch number is actually X" -> invokes edit_complaint
        print("[TEST 3] Follow-up correction: 'Sorry, the batch number is actually X' (Tool: edit_complaint)...")
        c1_id = c1["id"]
        original_product = c1["product_name"]
        original_customer = c1["customer_name"]

        res3 = process_copilot_request(
            message="Sorry, the batch number is actually AZ-9999",
            db=db,
            active_complaint_id=c1_id
        )

        assert res3.get("tool_invoked") == "edit_complaint", f"FAIL: Expected tool 'edit_complaint', got '{res3.get('tool_invoked')}'"
        c3 = res3.get("active_complaint")
        assert c3 is not None, "FAIL: Expected active_complaint object"
        assert c3.get("batch_number") == "AZ-9999", f"FAIL: Expected updated batch AZ-9999, got {c3.get('batch_number')}"
        assert c3.get("product_name") == original_product, f"FAIL: Product name was overwritten! Expected {original_product}, got {c3.get('product_name')}"
        assert c3.get("customer_name") == original_customer, f"FAIL: Customer name was overwritten! Expected {original_customer}, got {c3.get('customer_name')}"
        assert "batch_number" in res3.get("patched_fields", []), f"FAIL: Expected batch_number in patched_fields, got {res3.get('patched_fields')}"
        print(f"✓ PASS: edit_complaint invoked successfully! Patched ONLY batch_number to 'AZ-9999' while preserving product='{c3['product_name']}' and customer='{c3['customer_name']}'.\n")

        print("=========================================================")
        print("ALL AGENT TOOL ORCHESTRATION TESTS PASSED 100%!")
        print("=========================================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_agent_tool_tests()
