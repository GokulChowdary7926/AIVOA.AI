#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.ai.workflow import run_complaint_pipeline

def run_tests():
    print("=========================================================")
    print("AIVOA.AI — CORRECT BEHAVIOR SPEC VERIFICATION SUITE")
    print("=========================================================\n")

    # TEST 1: Absent Field Handling (Missing Batch & Customer)
    print("[TEST 1] Absent Field Handling (No Batch Number in text)...")
    text_no_batch = "Received complaint regarding Paclitaxel Injection 6mg/mL. Solution showed small dark specks."
    res1 = run_complaint_pipeline(text_no_batch, [])
    assert res1.get("batch_number") is None, f"FAIL: Expected batch_number to be None, got {res1.get('batch_number')}"
    assert res1.get("customer_name") is None, f"FAIL: Expected customer_name to be None, got {res1.get('customer_name')}"
    print(f"✓ PASS: Missing fields correctly returned as None/null (batch={res1.get('batch_number')}, customer={res1.get('customer_name')})\n")

    # TEST 2: Risk Triage vs Sentiment Analysis
    print("[TEST 2A] Angry Tone with Cosmetic Defect...")
    text_angry_cosmetic = "THIS IS UNACCEPTABLE AND HORRIBLE QUALITY!! THE OUTER CARDBOARD CARTON LABEL HAS A TINY INK SMUDGE ON THE BOTTOM CORNER! I AM EXTREMELY FURIOUS!!"
    res_angry = run_complaint_pipeline(text_angry_cosmetic, [])
    risk_angry = res_angry.get("risk_classification", {}).get("level")
    assert risk_angry in ["Low", "Medium"], f"FAIL: Angry tone cosmetic defect classified as {risk_angry}"
    print(f"✓ PASS: Angry tone with cosmetic defect classified as '{risk_angry}' (Not High/Critical)\n")

    print("[TEST 2B] Calm Tone with Severe Parenteral Contamination...")
    text_calm_severe = "Kindly note for your records that cleanroom inspection of Paclitaxel Injection 6mg/mL (Batch #AZ-9041) revealed dark particulate matter inside sealed vial."
    res_calm = run_complaint_pipeline(text_calm_severe, [])
    risk_calm = res_calm.get("risk_classification", {}).get("level")
    assert risk_calm in ["High", "Critical"], f"FAIL: Severe particulate defect classified as {risk_calm}"
    print(f"✓ PASS: Calm tone with severe particulate defect classified as '{risk_calm}' (High/Critical)\n")

    # TEST 3: DB-Grounded Duplicate Detection
    print("[TEST 3A] Empty Database Duplicate Check...")
    res_empty_db = run_complaint_pipeline(text_calm_severe, [])
    assert res_empty_db.get("duplicate_matches") == [], f"FAIL: Expected empty list, got {res_empty_db.get('duplicate_matches')}"
    print("✓ PASS: Empty database returns zero phantom duplicate matches ([]).\n")

    print("[TEST 3B] Duplicate Match against Real DB Context...")
    existing_db = [{
        "id": "c111-2222-3333",
        "product": "Paclitaxel Injection 6mg/mL",
        "batch": "AZ-9041",
        "description": "Visible particulate specks in vial Batch #AZ-9041."
    }]
    res_dup = run_complaint_pipeline(text_calm_severe, existing_db)
    dups = res_dup.get("duplicate_matches", [])
    assert len(dups) > 0, "FAIL: Expected duplicate match for same batch"
    print(f"✓ PASS: Duplicate match found for batch AZ-9041: {dups[0]['reason']} ({dups[0]['confidence']} confidence)\n")

    print("[TEST 3C] Unrelated Complaint Non-Match...")
    text_unrelated = "Customer reported light label smudge on Paracetamol Pediatric Syrup (Batch #LB-1002)."
    res_unrelated = run_complaint_pipeline(text_unrelated, existing_db)
    assert len(res_unrelated.get("duplicate_matches", [])) == 0, "FAIL: Unrelated complaint should not match"
    print("✓ PASS: Unrelated complaint correctly NOT flagged as duplicate.\n")

    # TEST 4: Specific Root Cause 5M & CAPA Owners
    print("[TEST 4] Root Cause & CAPA Owner Specificity...")
    text_assay = "Quality Control notification: Amoxicillin 500mg Capsules (Batch #TB-4412) stability assay at 82.4% potency (Out of Specification)."
    res_assay = run_complaint_pipeline(text_assay, [])
    cats_assay = res_assay.get("root_cause_suggestion", {}).get("likely_categories", [])
    owner_assay = res_assay.get("capa_suggestion", {}).get("suggested_owner")
    print(f"  Assay Subpotency -> 5M Categories: {cats_assay}, Owner: {owner_assay}")

    res_blister = run_complaint_pipeline("Metformin ER 500mg (Batch PK-8810) unsealed foil blister strip.", [])
    cats_blister = res_blister.get("root_cause_suggestion", {}).get("likely_categories", [])
    owner_blister = res_blister.get("capa_suggestion", {}).get("suggested_owner")
    print(f"  Blister Foil Seal -> 5M Categories: {cats_blister}, Owner: {owner_blister}")

    assert cats_assay != cats_blister or owner_assay != owner_blister, "FAIL: Root cause / CAPA should vary per defect type"
    print("✓ PASS: Root cause 5M categories and CAPA owners vary specifically per defect type.\n")

    # TEST 5: Completeness Gating
    print("[TEST 5] Completeness Score Gating...")
    text_sparse = "Customer reported defect."
    res_sparse = run_complaint_pipeline(text_sparse, [])
    score_sparse = res_sparse.get("completeness_score", {}).get("score")
    missing_sparse = res_sparse.get("completeness_score", {}).get("missing_fields", [])

    print(f"  Sparse Complaint -> Score: {score_sparse}/100, Missing: {missing_sparse}")
    assert score_sparse < 50, f"FAIL: Expected score < 50 for sparse complaint, got {score_sparse}"
    assert "Product Name" in missing_sparse and "Batch / Lot Number" in missing_sparse, "FAIL: Missing fields not accurate"
    print("✓ PASS: Completeness score accurately gates quality and lists missing fields.\n")

    print("=========================================================")
    print("ALL 7 CORRECT BEHAVIOR SPEC SUITE TESTS PASSED 100%!")
    print("=========================================================")

if __name__ == "__main__":
    run_tests()
