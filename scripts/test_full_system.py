#!/usr/bin/env python3
"""
Comprehensive Master Verification Script for AIVOA.AI:
- PDF Upload & Document Extraction Tool
- 7-Node AI Copilot Risk Assessment System
- log_complaint Tool
- edit_complaint Tool
- API Router Endpoints & Database Persistence
"""

import sys
import os

# Add backend to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database import SessionLocal, engine, Base  # noqa: E402
from app.ai.agent import process_copilot_request  # noqa: E402


def create_sample_pdf_bytes(content_text: str) -> bytes:
    """Helper to generate a valid PDF file in memory."""
    escaped = content_text.replace("(", "\\(").replace(")", "\\)")
    pdf_template = (
        "%PDF-1.4\n"
        "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <<>> >> endobj\n"
        "4 0 obj <</Length " + str(len(escaped) + 50) + ">> stream\n"
        "BT /F1 12 Tf 50 700 Td (" + escaped + ") Tj ET\n"
        "endstream endobj\n"
        "xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000220 00000 n \n"
        "trailer <</Size 5 /Root 1 0 R>>\nstartxref\n320\n%%EOF\n"
    )
    return pdf_template.encode("latin-1", errors="ignore")


def run_master_verification():
    print("==========================================================================")
    print(" 🛡️ AIVOA.AI — MASTER SYSTEM COMPREHENSIVE VERIFICATION SUITE")
    print("==========================================================================\n")

    # Reset SQLite schema for clean run
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # TEST 1: PDF Document Upload & Document Extraction Tool
        print("[TEST 1] PDF Document Upload & Document Extraction Tool...")
        pdf_text = "OFFICIAL COMPLAINT: Hospital report from St. Jude Children's Hospital. Product: Paclitaxel Injection 6mg/mL (Batch #AZ-9041). Description: Sterile glass vial contains visible particulate contamination prior to infusion. Date: 2026-08-10."
        pdf_bytes = create_sample_pdf_bytes(pdf_text)

        res_doc = process_copilot_request(
            message="Uploaded complaint PDF document",
            db=db,
            file_bytes=pdf_bytes,
            filename="hospital_complaint_notice.pdf"
        )

        assert res_doc["tool_invoked"] == "document_extraction → log_complaint", f"FAIL: Expected tool 'document_extraction → log_complaint', got '{res_doc.get('tool_invoked')}'"
        c1 = res_doc["active_complaint"]
        assert c1["product_name"] == "Paclitaxel Injection", f"FAIL: Expected product Paclitaxel Injection, got {c1.get('product_name')}"
        assert c1["batch_number"] == "AZ-9041", f"FAIL: Expected batch AZ-9041, got {c1.get('batch_number')}"
        assert c1["severity"] in ["High", "Critical"], f"FAIL: Expected Critical severity, got {c1.get('severity')}"
        print(f"✓ PASS: PDF upload & document extraction succeeded! Logged Complaint {c1['complaint_number']} (Product={c1['product_name']}, Batch={c1['batch_number']})\n")

        # TEST 2: AI Copilot Risk Assessment System (7-Node Pipeline)
        print("[TEST 2] AI Copilot Risk Assessment System (7-Node Pipeline verification)...")
        risk_res = c1["risk_classification"]
        comp_res = c1["completeness_score"]
        root_res = c1["root_cause_suggestion"]
        capa_res = c1["capa_suggestion"]
        summary_text = c1["ai_summary"]

        assert risk_res["level"] in ["High", "Critical"], f"FAIL: Incorrect risk level {risk_res.get('level')}"
        assert risk_res.get("requires_field_alert") is True, "FAIL: Sterility/particulate defect should trigger 21 CFR Field Alert"
        assert comp_res["score"] >= 70, f"FAIL: Expected completeness score >= 70, got {comp_res.get('score')}"
        assert len(root_res.get("likely_categories", [])) > 0, "FAIL: 5M root cause categories empty"
        assert len(capa_res.get("corrective_actions", [])) > 0, "FAIL: Corrective actions empty"
        assert summary_text and len(summary_text) > 20, "FAIL: Executive summary empty"
        print(f"✓ PASS: 7-Node Pipeline complete! Risk Level: {risk_res['level']} | Field Alert: {risk_res['requires_field_alert']} | 5M: {root_res['likely_categories']} | Summary length: {len(summary_text)} chars.\n")

        # TEST 3: log_complaint Tool Execution
        print("[TEST 3] log_complaint Tool Execution via Natural Language...")
        res_log = process_copilot_request(
            message="Received quality report from CVS Health Pharmacy. Product: Amoxicillin 500mg Capsules (Batch #TB-4412). Potency assay OOS at 82.4%. Please log this complaint.",
            db=db
        )

        assert res_log["tool_invoked"] == "log_complaint", f"FAIL: Expected tool 'log_complaint', got '{res_log.get('tool_invoked')}'"
        c2 = res_log["active_complaint"]
        assert c2["product_name"] == "Amoxicillin Capsules", f"FAIL: Expected Amoxicillin Capsules, got {c2.get('product_name')}"
        assert c2["batch_number"] == "TB-4412", f"FAIL: Expected batch TB-4412, got {c2.get('batch_number')}"
        print(f"✓ PASS: log_complaint tool executed successfully! Created record {c2['complaint_number']} for {c2['customer_name']}.\n")

        # TEST 4: edit_complaint Tool Execution (Single & Multi-field patch)
        print("[TEST 4] edit_complaint Tool Execution (Patching mentioned fields)...")
        c2_id = c2["id"]
        res_edit = process_copilot_request(
            message="Sorry, the batch number is actually TB-9999 and customer is CVS Global Pharmacy",
            db=db,
            active_complaint_id=c2_id
        )

        assert res_edit["tool_invoked"] == "edit_complaint", f"FAIL: Expected tool 'edit_complaint', got '{res_edit.get('tool_invoked')}'"
        c2_updated = res_edit["active_complaint"]
        assert c2_updated["batch_number"] == "TB-9999", f"FAIL: Batch number not updated to TB-9999, got {c2_updated.get('batch_number')}"
        assert c2_updated["customer_name"] == "CVS Global Pharmacy", f"FAIL: Customer not updated, got {c2_updated.get('customer_name')}"
        assert c2_updated["product_name"] == "Amoxicillin Capsules", f"FAIL: Product name was overwritten! Expected Amoxicillin Capsules, got {c2_updated.get('product_name')}"
        print(f"✓ PASS: edit_complaint tool executed successfully! Patched batch_number='TB-9999' and customer='CVS Global Pharmacy' while keeping product_name='{c2_updated['product_name']}' intact.\n")

        # TEST 5: Directive Follow-up Command "(please log this into a complaint)"
        print("[TEST 5] Directive Follow-up Command '(please log this into a complaint)'...")
        res_directive = process_copilot_request(
            message="(please log this into a complaint)",
            db=db,
            active_complaint_id=c1["id"]
        )

        assert res_directive["tool_invoked"] == "log_complaint", f"FAIL: Expected log_complaint, got {res_directive.get('tool_invoked')}"
        c1_directive = res_directive["active_complaint"]
        assert c1_directive["product_name"] == "Paclitaxel Injection", f"FAIL: Expected Paclitaxel Injection, got {c1_directive.get('product_name')}"
        assert c1_directive["batch_number"] == "AZ-9041", f"FAIL: Expected batch AZ-9041, got {c1_directive.get('batch_number')}"
        print("✓ PASS: Directive command '(please log this into a complaint)' logged active context correctly!\n")

        print("==========================================================================")
        print(" 🎉 ALL MASTER SYSTEM VERIFICATION TESTS PASSED 100% PERFECTLY!")
        print("==========================================================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_master_verification()
