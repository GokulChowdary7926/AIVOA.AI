import React from "react";
import { useSelector } from "react-redux";

const riskBadgeClass = (level) => {
  switch ((level || "").toLowerCase()) {
    case "low":
      return "badge badge-low";
    case "medium":
      return "badge badge-medium";
    case "high":
      return "badge badge-high";
    case "critical":
      return "badge badge-critical";
    default:
      return "badge";
  }
};

export default function AICopilotPanel() {
  const { activeComplaint, status } = useSelector((s) => s.complaints);

  if (status === "loading") {
    return (
      <div className="panel copilot-panel loading-state">
        <div className="panel-header">
          <h2>AI Copilot — Risk Assessment</h2>
          <span className="subtitle-tag">Groq LLM + LangGraph Pipeline</span>
        </div>
        <div className="copilot-skeleton">
          <div className="skeleton-line pulse"></div>
          <div className="skeleton-card pulse"></div>
          <div className="skeleton-card pulse"></div>
          <p className="loading-text">
            Analyzing QMS severity, matching duplicate batches, and drafting 5M root cause & CAPA plan...
          </p>
        </div>
      </div>
    );
  }

  if (!activeComplaint) {
    return (
      <div className="panel copilot-panel empty-state">
        <div className="panel-header">
          <h2>AI Copilot — Risk Assessment</h2>
          <span className="subtitle-tag">QMS Intelligence Engine</span>
        </div>
        <div className="empty-content">
          <div className="empty-icon">🤖</div>
          <h3>No Complaint Active</h3>
          <p>
            Paste a complaint or click a <strong>Demo Quick Preset</strong> on the left form to execute the LangGraph AI copilot and view real-time QMS risk analysis.
          </p>
        </div>
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

  const scoreVal = completeness_score?.score ?? 85;
  const isFieldAlert = risk_classification?.requires_field_alert || activeComplaint.regulatory_reportable;

  return (
    <div className="panel copilot-panel">
      <div className="panel-header">
        <h2>AI Copilot — Risk Assessment</h2>
        <span className="subtitle-tag">Live LangGraph QMS Assessment</span>
      </div>

      {/* Field Alert Warning Banner */}
      {isFieldAlert && (
        <div className="field-alert-banner">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>21 CFR Part 211 / Regulatory Field Alert Warning</strong>
            <p>Mandatory 15-day regulatory notification triggered due to sterility/subpotency/patient safety defect.</p>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div className="copilot-card summary-card">
        <div className="card-header">
          <h3>Executive Summary</h3>
          <span className="card-tag">LangGraph Node #7</span>
        </div>
        <p className="summary-text">{ai_summary || "Processing executive summary..."}</p>
      </div>

      {/* Risk Classification */}
      <div className="copilot-card risk-card">
        <div className="card-header">
          <h3>Risk Classification & Regulatory Impact</h3>
          <span className={riskBadgeClass(risk_classification?.level || activeComplaint.severity)}>
            {(risk_classification?.level || activeComplaint.severity || "Medium").toUpperCase()}
          </span>
        </div>
        <p className="justification-text">{risk_classification?.justification}</p>
      </div>

      {/* Completeness Check */}
      <div className="copilot-card completeness-card">
        <div className="card-header">
          <h3>QMS Record Completeness Score</h3>
          <div className="score-badge">{scoreVal} / 100</div>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${scoreVal >= 80 ? "fill-high" : scoreVal >= 50 ? "fill-med" : "fill-low"}`}
            style={{ width: `${scoreVal}%` }}
          ></div>
        </div>
        {completeness_score?.missing_fields?.length > 0 ? (
          <div className="missing-box">
            <span className="box-label">Missing Required Fields:</span>
            <div className="pill-list">
              {completeness_score.missing_fields.map((f) => (
                <span key={f} className="pill pill-missing">
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="complete-note">✓ Record contains all critical QMS compliance fields.</p>
        )}
        {completeness_score?.notes && <p className="notes-text">💡 {completeness_score.notes}</p>}
      </div>

      {/* Duplicate Complaint Detection */}
      <div className="copilot-card duplicate-card">
        <div className="card-header">
          <h3>Duplicate Complaint Detection</h3>
          <span className="card-tag">Batch & Symptom Cross-Matching</span>
        </div>
        {(duplicate_matches || []).length === 0 ? (
          <p className="no-matches">No duplicate complaints detected in recent batch database records.</p>
        ) : (
          <div className="matches-list">
            {(duplicate_matches || []).map((m, idx) => (
              <div key={idx} className="match-item">
                <div className="match-header">
                  <span className="match-id">Match #{m.id?.slice(0, 8)}</span>
                  <span className={`confidence-pill conf-${(m.confidence || "Medium").toLowerCase()}`}>
                    {m.confidence} Confidence
                  </span>
                </div>
                <p className="match-reason">{m.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Root Cause Recommendation */}
      <div className="copilot-card root-cause-card">
        <div className="card-header">
          <h3>Root Cause Analysis (5M QMS Methodology)</h3>
          <span className="card-tag">Fishbone / Ishikawa</span>
        </div>
        <div className="pill-list categories-list">
          {(root_cause_suggestion?.likely_categories || ["Machine", "Material"]).map((c) => (
            <span key={c} className="pill pill-5m">
              {c}
            </span>
          ))}
        </div>
        <p className="reasoning-text">{root_cause_suggestion?.reasoning}</p>

        {root_cause_suggestion?.recommended_investigation_steps?.length > 0 && (
          <div className="steps-box">
            <span className="box-label">Recommended Investigation Protocol:</span>
            <ol className="investigation-steps">
              {root_cause_suggestion.recommended_investigation_steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* CAPA Recommendation */}
      <div className="copilot-card capa-card">
        <div className="card-header">
          <h3>Draft CAPA Action Plan</h3>
          <span className="owner-badge">Owner: {capa_suggestion?.suggested_owner || "QA Lead"}</span>
        </div>
        <div className="capa-grid">
          <div className="capa-box corrective">
            <span className="box-title">Corrective Actions (Immediate)</span>
            <ul>
              {(capa_suggestion?.corrective_actions || ["Quarantine affected batch", "Inspect retain samples"]).map(
                (act, i) => (
                  <li key={i}>{act}</li>
                )
              )}
            </ul>
          </div>
          <div className="capa-box preventive">
            <span className="box-title">Preventive Actions (Long-Term)</span>
            <ul>
              {(capa_suggestion?.preventive_actions || ["Update line clearance SOP", "Calibrate vision sensors"]).map(
                (act, i) => (
                  <li key={i}>{act}</li>
                )
              )}
            </ul>
          </div>
        </div>
        <div className="closure-target">
          Target Closure Timeline: <strong>{capa_suggestion?.target_closure_days || 30} Days</strong>
        </div>
      </div>
    </div>
  );
}
