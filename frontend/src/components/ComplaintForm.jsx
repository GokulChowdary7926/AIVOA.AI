import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  submitTextComplaint,
  submitFileComplaint,
  updateActiveComplaintField,
  saveComplaintEdits,
} from "../store/complaintSlice.js";
import { SAMPLE_COMPLAINTS } from "../data/sampleData.js";

const PIPELINE_NODES = [
  "1. Extract Fields",
  "2. Completeness Check",
  "3. Duplicate Detection",
  "4. Risk Classification",
  "5. Root Cause (5M)",
  "6. CAPA Recommendation",
  "7. Summary",
];

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { activeComplaint, status } = useSelector((s) => s.complaints);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isLoading = status === "loading";

  // Pre-fill text box when sample scenario is picked
  const handleSelectPreset = (sample) => {
    setRawText(sample.text);
  };

  const handleSubmitText = (e) => {
    if (e) e.preventDefault();
    if (!rawText.trim() || isLoading) return;
    dispatch(submitTextComplaint(rawText));
  };

  const handleFileUpload = (f) => {
    if (!f || isLoading) return;
    setFile(f);
    dispatch(submitFileComplaint(f));
  };

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
          batch_number: activeComplaint.batch_number,
          complaint_type: activeComplaint.complaint_type,
          severity: activeComplaint.severity,
          complaint_description: activeComplaint.complaint_description,
          regulatory_reportable: activeComplaint.regulatory_reportable,
          assigned_owner: activeComplaint.assigned_owner,
          status: activeComplaint.status || "Open",
        },
      })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const c = activeComplaint || {};

  return (
    <div className="panel form-panel">
      <div className="panel-header">
        <h2>Log Customer Complaint</h2>
        <span className="subtitle-tag">GMP / 21 CFR Part 211 QMS Intake</span>
      </div>

      {/* Preset Quick Loader */}
      <div className="preset-section">
        <label className="section-label">⚡ Demo Quick Presets (1-Click Sample Load):</label>
        <div className="preset-buttons">
          {SAMPLE_COMPLAINTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`preset-btn preset-${s.risk.toLowerCase()}`}
              onClick={() => handleSelectPreset(s)}
            >
              <span className="preset-risk-dot"></span>
              {s.risk}: {s.product.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Intake form */}
      <form onSubmit={handleSubmitText} className="intake-form">
        <label className="input-label">Complaint Raw Text / Customer Email</label>
        <textarea
          className="text-input"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste customer email text, quality failure notice, or hospital complaint report here..."
          rows={5}
        />

        <div className="action-row">
          <button className="btn-primary" type="submit" disabled={isLoading || !rawText.trim()}>
            {isLoading ? "Running LangGraph AI Pipeline..." : "Process Complaint with AI Agent"}
          </button>
        </div>
      </form>

      {/* Drag & Drop File Upload */}
      <div
        className={`file-dropzone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <div className="dropzone-content">
          <span className="upload-icon">📄</span>
          <div>
            <strong>Drag & Drop PDF or Email file</strong> (.pdf, .eml, .txt)
            <br />
            <span className="text-muted">or click to select file from disk</span>
          </div>
          <input
            type="file"
            accept=".pdf,.txt,.eml"
            className="file-input-hidden"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />
        </div>
      </div>

      {/* LangGraph Pipeline Steps Progress Indicator */}
      {isLoading && (
        <div className="pipeline-loader">
          <div className="spinner"></div>
          <div>
            <strong>LangGraph Sequential Node Execution (Groq LLM)</strong>
            <div className="pipeline-steps-bar">
              {PIPELINE_NODES.map((node, i) => (
                <span key={node} className="step-chip active">
                  {node}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extracted Fields Form */}
      <div className="ai-section form-fields-section">
        <div className="section-title-row">
          <h3>Form Field Extraction & QA Review</h3>
          {activeComplaint && (
            <span className="status-badge status-open">
              Status: {c.status || "Open"}
            </span>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Customer Name</label>
            <input
              type="text"
              value={c.customer_name || ""}
              onChange={(e) => handleInputChange("customer_name", e.target.value)}
              placeholder="e.g. St. Jude Children's Hospital"
            />
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={c.product_name || ""}
              onChange={(e) => handleInputChange("product_name", e.target.value)}
              placeholder="e.g. Paclitaxel Injection 6mg/mL"
            />
          </div>

          <div className="form-group">
            <label>Batch / Lot Number</label>
            <input
              type="text"
              value={c.batch_number || ""}
              onChange={(e) => handleInputChange("batch_number", e.target.value)}
              placeholder="e.g. AZ-9041"
            />
          </div>

          <div className="form-group">
            <label>Complaint Type</label>
            <select
              value={c.complaint_type || "Quality Defect"}
              onChange={(e) => handleInputChange("complaint_type", e.target.value)}
            >
              <option value="Quality Defect">Quality Defect</option>
              <option value="Packaging">Packaging</option>
              <option value="Adverse Event">Adverse Event</option>
              <option value="Delivery/Logistics">Delivery/Logistics</option>
              <option value="Documentation">Documentation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>AI Assigned Severity</label>
            <select
              value={c.severity || "Medium"}
              onChange={(e) => handleInputChange("severity", e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assigned QA Owner</label>
            <input
              type="text"
              value={c.assigned_owner || "QA Compliance Lead"}
              onChange={(e) => handleInputChange("assigned_owner", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Regulatory Field Alert Required (21 CFR Part 211 / FDA)?</label>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="reportable-check"
              checked={Boolean(c.regulatory_reportable)}
              onChange={(e) => handleInputChange("regulatory_reportable", e.target.checked)}
            />
            <label htmlFor="reportable-check" className="inline-label">
              Mandatory 15-Day Field Alert / Adverse Event Regulatory Notification
            </label>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Complaint Detailed Description</label>
          <textarea
            value={c.complaint_description || ""}
            onChange={(e) => handleInputChange("complaint_description", e.target.value)}
            rows={3}
            placeholder="AI restated complaint description..."
          />
        </div>

        {activeComplaint && (
          <div className="save-row">
            <button className="btn-secondary" onClick={handleSaveEdits}>
              💾 Confirm & Save QA Edits to QMS Database
            </button>
            {saveSuccess && <span className="save-success">✓ Record Saved!</span>}
          </div>
        )}
      </div>
    </div>
  );
}
