import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedComplaint } from "../store/complaintSlice.js";

const riskBadgeClass = (level) => {
  switch ((level || "").toLowerCase()) {
    case "low": return "badge badge-low";
    case "medium": return "badge badge-medium";
    case "high": return "badge badge-high";
    case "critical": return "badge badge-critical";
    default: return "badge";
  }
};

export default function ComplaintDetailModal() {
  const dispatch = useDispatch();
  const { selectedComplaint } = useSelector((s) => s.complaints);

  if (!selectedComplaint) return null;

  const c = selectedComplaint;
  const risk = c.risk_classification?.level || c.severity || "Medium";

  return (
    <div className="modal-backdrop" onClick={() => dispatch(setSelectedComplaint(null))}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Complaint Record #{c.id?.slice(0, 8)}</h2>
            <span className="subtitle-tag">Logged on {new Date(c.created_at || Date.now()).toLocaleString()}</span>
          </div>
          <button className="close-btn" onClick={() => dispatch(setSelectedComplaint(null))}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Extracted Structured Details</h3>
            <div className="detail-grid">
              <div><strong>Customer:</strong> {c.customer_name || "N/A"}</div>
              <div><strong>Product:</strong> {c.product_name || "N/A"}</div>
              <div><strong>Batch Number:</strong> {c.batch_number || "N/A"}</div>
              <div><strong>Complaint Type:</strong> {c.complaint_type || "N/A"}</div>
              <div><strong>Severity:</strong> <span className={riskBadgeClass(risk)}>{risk}</span></div>
              <div><strong>Status:</strong> <span className="status-badge">{c.status || "Open"}</span></div>
              <div><strong>Field Alert:</strong> {c.regulatory_reportable ? "⚠️ YES (15-Day FDA Alert)" : "No"}</div>
              <div><strong>Source:</strong> {c.source_type?.toUpperCase()}</div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Raw Complaint Input Text</h3>
            <div className="raw-text-box">{c.raw_text}</div>
          </div>

          <div className="detail-section">
            <h3>AI Executive Summary</h3>
            <p>{c.ai_summary || "No summary available."}</p>
          </div>

          <div className="detail-section">
            <h3>Risk Rationale & QMS Assessment</h3>
            <p>{c.risk_classification?.justification}</p>
          </div>

          {c.root_cause_suggestion && (
            <div className="detail-section">
              <h3>5M Root Cause Recommendation</h3>
              <div className="pill-list">
                {(c.root_cause_suggestion.likely_categories || []).map((cat) => (
                  <span key={cat} className="pill pill-5m">{cat}</span>
                ))}
              </div>
              <p style={{ marginTop: 8 }}>{c.root_cause_suggestion.reasoning}</p>
            </div>
          )}

          {c.capa_suggestion && (
            <div className="detail-section">
              <h3>CAPA Plan Recommendation</h3>
              <p><strong>Corrective Actions:</strong> {(c.capa_suggestion.corrective_actions || []).join("; ")}</p>
              <p><strong>Preventive Actions:</strong> {(c.capa_suggestion.preventive_actions || []).join("; ")}</p>
              <p><strong>Target Timeline:</strong> {c.capa_suggestion.target_closure_days || 30} Days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
