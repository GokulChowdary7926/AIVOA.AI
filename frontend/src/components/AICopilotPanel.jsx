import React from "react";
import { useSelector } from "react-redux";

const riskBadgeClass = (level) => {
  switch ((level || "").toLowerCase()) {
    case "low": return "badge badge-low";
    case "medium": return "badge badge-medium";
    case "high": return "badge badge-high";
    case "critical": return "badge badge-critical";
    default: return "badge";
  }
};

export default function AICopilotPanel() {
  const { activeComplaint, status } = useSelector((s) => s.complaints);

  if (status === "loading") {
    return (
      <div className="panel">
        <h2>AI Copilot — Risk Assessment</h2>
        <p>Running LangGraph analysis (completeness → duplicates → risk → root cause → CAPA)...</p>
      </div>
    );
  }

  if (!activeComplaint) {
    return (
      <div className="panel">
        <h2>AI Copilot — Risk Assessment</h2>
        <p style={{ color: "#6b7280" }}>
          Submit a complaint to see AI-generated completeness checks, risk
          classification, root cause suggestions, duplicate detection, and a
          draft CAPA plan here.
        </p>
      </div>
    );
  }

  const {
    completeness_score,
    risk_classification,
    duplicate_matches,
    root_cause_suggestion,
    capa_suggestion,
    ai_summary,
  } = activeComplaint;

  return (
    <div className="panel">
      <h2>AI Copilot — Risk Assessment</h2>

      <div className="ai-section">
        <h3>Summary</h3>
        <p>{ai_summary || "—"}</p>
      </div>

      <div className="ai-section">
        <h3>Risk Classification</h3>
        <span className={riskBadgeClass(risk_classification?.level)}>
          {risk_classification?.level || "Unknown"}
        </span>
        <p style={{ marginTop: 8 }}>{risk_classification?.justification}</p>
      </div>

      <div className="ai-section">
        <h3>Completeness Check</h3>
        <p>Score: {completeness_score?.score ?? "—"}/100</p>
        <div className="pill-list">
          {(completeness_score?.missing_fields || []).map((f) => (
            <span key={f} className="pill">{f}</span>
          ))}
        </div>
      </div>

      <div className="ai-section">
        <h3>Duplicate Complaint Detection</h3>
        {(duplicate_matches || []).length === 0 && <p>No likely duplicates found.</p>}
        {(duplicate_matches || []).map((m) => (
          <p key={m.id}>
            <strong>#{m.id?.slice(0, 8)}</strong> — {m.reason} ({m.confidence})
          </p>
        ))}
      </div>

      <div className="ai-section">
        <h3>Root Cause Recommendation</h3>
        <div className="pill-list">
          {(root_cause_suggestion?.likely_categories || []).map((c) => (
            <span key={c} className="pill">{c}</span>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>{root_cause_suggestion?.reasoning}</p>
      </div>

      <div className="ai-section">
        <h3>CAPA Recommendation</h3>
        <p><strong>Corrective:</strong> {(capa_suggestion?.corrective_actions || []).join("; ")}</p>
        <p><strong>Preventive:</strong> {(capa_suggestion?.preventive_actions || []).join("; ")}</p>
        <p><strong>Suggested Owner:</strong> {capa_suggestion?.suggested_owner}</p>
      </div>
    </div>
  );
}
