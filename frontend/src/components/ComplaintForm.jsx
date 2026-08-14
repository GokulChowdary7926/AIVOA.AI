import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  submitTextComplaint,
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

  return (
    <div className="panel form-panel">
      {/* Panel Header */}
      <div className="panel-header-spec">
        <div>
          <h2 className="spec-title">Log Customer Complaint</h2>
          <span className="spec-subtitle">API & FDF Quality Assurance Module</span>
        </div>
        <span className="badge-triage">Pending Triage</span>
      </div>

      <div className="form-sections-container">
        {/* Section 1 */}
        <div className="form-spec-section">
          <div className="spec-section-header">1. ORIGIN & CUSTOMER DETAILS</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Complaint Source</label>
              <input
                type="text"
                value={c.source_type ? c.source_type.toUpperCase() + " Intake" : ""}
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

        {/* Section 2 */}
        <div className="form-spec-section">
          <div className="spec-section-header">2. PRODUCT & BATCH IDENTIFICATION</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={c.product_name || ""}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
            <div className="form-group">
              <label>Product Strength/Grade</label>
              <input
                type="text"
                value={c.product_strength || ""}
                onChange={(e) => handleInputChange("product_strength", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>

            <div className="form-group">
              <label>Batch/Lot Number</label>
              <input
                type="text"
                value={c.batch_number || ""}
                onChange={(e) => handleInputChange("batch_number", e.target.value)}
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
            <div className="form-group input-suffix-group">
              <label>Quantity Affected</label>
              <div className="suffix-wrapper">
                <input
                  type="text"
                  value={c.quantity_affected || ""}
                  onChange={(e) => handleInputChange("quantity_affected", e.target.value)}
                  placeholder="Awaiting AI extraction..."
                />
                <span className="input-suffix">kg / units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="form-spec-section">
          <div className="spec-section-header">3. COMPLAINT DETAILS</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Complaint Type</label>
              <input
                type="text"
                value={c.complaint_type || ""}
                onChange={(e) => handleInputChange("complaint_type", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
            </div>
            <div className="form-group input-icon-group">
              <label>Complaint Date</label>
              <input
                type="text"
                value={c.complaint_date || ""}
                onChange={(e) => handleInputChange("complaint_date", e.target.value)}
                placeholder="Awaiting AI extraction..."
              />
              <span className="input-icon">📅</span>
            </div>
          </div>

          <div className="form-group full-width mt-10">
            <label>Detailed Complaint Description</label>
            <textarea
              value={c.complaint_description || ""}
              onChange={(e) => handleInputChange("complaint_description", e.target.value)}
              rows={3}
              placeholder="Awaiting AI extraction..."
            />
          </div>
        </div>

        {/* Section 4 */}
        <div className="form-spec-section">
          <div className="spec-section-header">4. INITIAL ASSESSMENT & PRIORITY</div>
          <div className="spec-grid-2">
            <div className="form-group">
              <label>Initial Severity</label>
              <select
                value={c.severity || "Awaiting AI extraction..."}
                onChange={(e) => handleInputChange("severity", e.target.value)}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={c.priority || "Awaiting AI extraction..."}
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="spec-bottom-bar">
        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset Form
        </button>
        <div className="save-btn-wrapper">
          <button className="btn-save-primary" onClick={handleSaveEdits}>
            💾 Save Complaint
          </button>
          {saveSuccess && <span className="save-toast">✓ Complaint Saved!</span>}
        </div>
      </div>
    </div>
  );
}
