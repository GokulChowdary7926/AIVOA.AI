import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateActiveComplaintField,
  saveComplaintEdits,
  clearActiveComplaint,
} from "../store/complaintSlice.js";

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { activeComplaint } = useSelector((s) => s.complaints);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    dispatch(updateActiveComplaintField({ field, value }));
  };

  const handleSaveEdits = () => {
    if (!activeComplaint?.id) return;
    dispatch(
      saveComplaintEdits({
        id: activeComplaint.id,
        data: {
          customer_name: activeComplaint.customer_name,
          product_name: activeComplaint.product_name,
          product_strength: activeComplaint.product_strength,
          batch_number: activeComplaint.batch_number,
          mfg_date: activeComplaint.mfg_date,
          expiry_date: activeComplaint.expiry_date,
          quantity_affected: activeComplaint.quantity_affected,
          complaint_type: activeComplaint.complaint_type,
          severity: activeComplaint.severity,
          priority: activeComplaint.priority,
          complaint_description: activeComplaint.complaint_description,
          complaint_date: activeComplaint.complaint_date,
          regulatory_reportable: activeComplaint.regulatory_reportable,
          assigned_owner: activeComplaint.assigned_owner,
          status: activeComplaint.status || "Open",
        },
      })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    dispatch(clearActiveComplaint());
  };

  const c = activeComplaint || {};
  const isPopulated = Boolean(c.product_name || c.customer_name || c.id);

  // Derived / fallback values matching UI layout specification
  const sourceVal = c.source_type
    ? c.source_type.toLowerCase() === "pdf"
      ? "PDF Document Upload"
      : c.source_type.toLowerCase() === "email"
      ? "Email Communication"
      : c.source_type.toLowerCase() === "text"
      ? "Direct Text Intake"
      : "Pharmacy"
    : "";

  const categoryVal = c.complaint_type
    ? `Product Defect - ${c.complaint_type}`
    : "Product Defect - Discoloration";

  const suggestedActionVal =
    c.suggested_action ||
    (c.capa_suggestion?.corrective_actions?.[0]
      ? `Routine CAPA - ${c.capa_suggestion.corrective_actions[0]}`
      : "Routine CAPA - Batch Investigation & Replacement");

  const initialRiskVal =
    c.initial_risk_assessment ||
    c.risk_classification?.justification ||
    c.ai_summary ||
    "Potential moisture ingress or primary packaging seal failure leading to capsule discoloration. Requesting investigation and replacement.";

  return (
    <div className="panel form-panel">
      {/* Panel Header */}
      <div className="panel-header-spec">
        <div>
          <h2 className="spec-title">Log Customer Complaint</h2>
          <span className="spec-subtitle">API & FDF Quality Assurance Module</span>
        </div>
        {isPopulated ? (
          <span className="badge-triage ready">• Ready to Commit</span>
        ) : (
          <span className="badge-triage pending">Pending Triage</span>
        )}
      </div>

      <div className="form-sections-container">
        {/* Section 1: ORIGIN & CUSTOMER DETAILS */}
        <div className="form-spec-section">
          <div className="spec-section-header">1. ORIGIN & CUSTOMER DETAILS</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Complaint Source</label>
              <input
                type="text"
                value={c.source_type ? sourceVal : ""}
                onChange={(e) => handleInputChange("source_type", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
            <div className="form-group">
              <label>Customer Name</label>
              <input
                type="text"
                value={c.customer_name || ""}
                onChange={(e) => handleInputChange("customer_name", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: PRODUCT & BATCH IDENTIFICATION */}
        <div className="form-spec-section">
          <div className="spec-section-header">2. PRODUCT & BATCH IDENTIFICATION</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Product Name (API/FDF)</label>
              <input
                type="text"
                value={c.product_name || ""}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
            <div className="form-group">
              <label>Product Strength</label>
              <input
                type="text"
                value={c.product_strength || ""}
                onChange={(e) => handleInputChange("product_strength", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>

            <div className="form-group">
              <label>Batch / Lot Number</label>
              <input
                type="text"
                value={c.batch_number || ""}
                onChange={(e) => handleInputChange("batch_number", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
            <div className="form-group">
              <label>Affected Quantity</label>
              <input
                type="text"
                value={c.quantity_affected || ""}
                onChange={(e) => handleInputChange("quantity_affected", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>

            <div className="form-group input-icon-group">
              <label>Manufacturing Date</label>
              <input
                type="text"
                value={c.mfg_date || ""}
                onChange={(e) => handleInputChange("mfg_date", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
              <span className="input-icon">📅</span>
            </div>
            <div className="form-group input-icon-group">
              <label>Expiry Date</label>
              <input
                type="text"
                value={c.expiry_date || ""}
                onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
              <span className="input-icon">📅</span>
            </div>
          </div>
        </div>

        {/* Section 3: FACILITY & MATERIAL IMPACT */}
        <div className="form-spec-section">
          <div className="spec-section-header">3. FACILITY & MATERIAL IMPACT</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Originating Site Block</label>
              <select
                value={c.site_block || "Block A - Oral Solid Dosage (OSD)"}
                onChange={(e) => handleInputChange("site_block", e.target.value)}
              >
                <option value="">Awaiting AI classification...</option>
                <option value="Block A - Oral Solid Dosage (OSD)">Block A - Oral Solid Dosage (OSD)</option>
                <option value="Block B - Sterile Parenterals & Injectables">Block B - Sterile Parenterals & Injectables</option>
                <option value="Block C - Active Ingredients (APIs)">Block C - Active Ingredients (APIs)</option>
                <option value="Block D - Packaging & Distribution">Block D - Packaging & Distribution</option>
              </select>
            </div>
            <div className="form-group">
              <label>Impacted Non-Product Materials (NPM)</label>
              <input
                type="text"
                value={c.non_product_materials || "Primary packaging seal / Alu-Alu foil"}
                onChange={(e) => handleInputChange("non_product_materials", e.target.value)}
                placeholder="e.g., Primary packaging..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: DEFECT ANALYSIS */}
        <div className="form-spec-section">
          <div className="spec-section-header">4. DEFECT ANALYSIS</div>
          <div className="form-group full-width">
            <label>Complaint Category</label>
            <input
              type="text"
              value={c.complaint_type ? categoryVal : ""}
              onChange={(e) => handleInputChange("complaint_type", e.target.value)}
              placeholder="Awaiting AI extraction..."
            />
          </div>

          <div className="form-group full-width mt-10">
            <label>Complaint Description</label>
            <textarea
              value={c.complaint_description || ""}
              onChange={(e) => handleInputChange("complaint_description", e.target.value)}
              rows={3}
              placeholder="AI will synthesize the complaint into a formal QMS description..."
            />
          </div>
        </div>

        {/* AI COPILOT RISK ASSESSMENT CARD */}
        <div className="copilot-risk-card">
          <div className="copilot-risk-header">
            <span>🛡️ AI copilot risk assessment</span>
          </div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Severity (Suggested)</label>
              <input
                type="text"
                value={c.severity || c.risk_classification?.level || "Major"}
                onChange={(e) => handleInputChange("severity", e.target.value)}
                placeholder="Awaiting AI risk score..."
              />
            </div>
            <div className="form-group">
              <label>Suggested Next Action</label>
              <input
                type="text"
                value={suggestedActionVal}
                onChange={(e) => handleInputChange("suggested_action", e.target.value)}
                placeholder="Awaiting AI suggestion..."
              />
            </div>
          </div>

          <div className="form-group full-width mt-10">
            <label>Initial Risk Assessment</label>
            <textarea
              value={initialRiskVal}
              onChange={(e) => handleInputChange("initial_risk_assessment", e.target.value)}
              rows={2}
              placeholder="Potential quality impact assessment..."
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="spec-bottom-bar">
        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset Form
        </button>
        <div className="save-btn-wrapper">
          <button className="btn-commit-qms" onClick={handleSaveEdits}>
            Commit to QMS Ledger
          </button>
          {saveSuccess && <span className="save-toast">✓ Committed to QMS Ledger!</span>}
        </div>
      </div>
    </div>
  );
}
