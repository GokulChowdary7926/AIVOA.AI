import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  submitTextComplaint,
  submitFileComplaint,
  sendCopilotMessage,
} from "../store/complaintSlice.js";
import { SAMPLE_COMPLAINTS } from "../data/sampleData.js";

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
  const dispatch = useDispatch();
  const { activeComplaint, status } = useSelector((s) => s.complaints);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [progressPct, setProgressPct] = useState(0);
  const [progressSubtext, setProgressSubtext] = useState("Awaiting document upload or text paste to begin extraction.");

  const isLoading = status === "loading";

  // Dynamic smooth progress animation during AI extraction
  React.useEffect(() => {
    let timer;
    if (isLoading) {
      setProgressPct(10);
      setProgressSubtext("Node 1: Extracting origin, customer & drug product details...");

      const steps = [
        { pct: 25, text: "Node 1 & 2: Identifying product strength, batch & manufacturing date..." },
        { pct: 40, text: "Node 2: Validating QMS record completeness & score..." },
        { pct: 55, text: "Node 3: Scanning prior database records for duplicate batches..." },
        { pct: 70, text: "Node 4: Classifying QMS risk severity & 21 CFR Field Alert status..." },
        { pct: 85, text: "Node 5 & 6: Formulating 5M root cause & draft CAPA action plan..." },
        { pct: 95, text: "Node 7: Finalizing executive summary & populating form fields..." },
      ];

      let idx = 0;
      timer = setInterval(() => {
        if (idx < steps.length) {
          setProgressPct(steps[idx].pct);
          setProgressSubtext(steps[idx].text);
          idx++;
        }
      }, 500);
    } else if (activeComplaint) {
      setProgressPct(100);
      setProgressSubtext("✓ Extraction & QMS risk assessment complete! Form fields populated.");
    } else {
      setProgressPct(0);
      setProgressSubtext("Awaiting document upload or text paste to begin extraction.");
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, activeComplaint]);

  const handleFileUpload = (f) => {
    if (!f || isLoading) return;
    setChatLog((prev) => [...prev, { sender: "user", text: `Uploaded document: ${f.name}` }]);
    dispatch(sendCopilotMessage({ file: f, activeComplaintId: activeComplaint?.id }))
      .unwrap()
      .then((res) => {
        setChatLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.reply,
            tool: res.tool_invoked,
          },
        ]);
      })
      .catch((err) => {
        dispatch(submitFileComplaint(f));
      });
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim() || isLoading) return;
    const textToSubmit = pasteText;
    setShowPasteModal(false);
    setPasteText("");
    setChatLog((prev) => [...prev, { sender: "user", text: `Submitted text: "${textToSubmit.slice(0, 80)}..." please log this complaint` }]);
    
    dispatch(sendCopilotMessage({ message: textToSubmit + " please log this complaint", activeComplaintId: activeComplaint?.id }))
      .unwrap()
      .then((res) => {
        setChatLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.reply,
            tool: res.tool_invoked,
          },
        ]);
      })
      .catch((err) => {
        dispatch(submitTextComplaint(textToSubmit));
      });
  };

  const handleRunPreset = (sample) => {
    setChatLog((prev) => [...prev, { sender: "user", text: `Executing sample: ${sample.title}` }]);
    dispatch(sendCopilotMessage({ message: sample.text + " please log this complaint", activeComplaintId: activeComplaint?.id }))
      .unwrap()
      .then((res) => {
        setChatLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.reply,
            tool: res.tool_invoked,
          },
        ]);
      })
      .catch((err) => {
        dispatch(submitTextComplaint(sample.text));
      });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;
    
    const userMsg = chatMessage;
    setChatMessage("");
    
    setChatLog((prev) => [...prev, { sender: "user", text: userMsg }]);

    dispatch(sendCopilotMessage({ message: userMsg, activeComplaintId: activeComplaint?.id }))
      .unwrap()
      .then((res) => {
        setChatLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.reply,
            tool: res.tool_invoked,
          },
        ]);
      })
      .catch((err) => {
        let aiAns = `Analyzing message regarding complaint #${activeComplaint?.id?.slice(0,8) || ''}.`;
        setChatLog((prev) => [...prev, { sender: "ai", text: aiAns }]);
      });
  };

  const c = activeComplaint;
  const scoreVal = c?.completeness_score?.score ?? (isLoading ? 10 : 0);
  const isFieldAlert = c?.risk_classification?.requires_field_alert || c?.regulatory_reportable;

  return (
    <div className="panel copilot-panel-spec">
      {/* Panel Header */}
      <div className="spec-copilot-header">
        <div className="title-with-icon">
          <span className="sparkle-icon">✨</span>
          <h2>AI Complaint Intake Assistant</h2>
        </div>
        <span className="beta-badge">BETA</span>
      </div>

      {/* Top File Upload Dropzone */}
      <div
        className={`spec-dropzone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <div className="cloud-icon">☁️</div>
        <div>
          <strong>Drag & drop complaint document here</strong>
          <br />
          <span className="browse-link">or click to browse</span>
        </div>
        <input
          type="file"
          accept=".pdf,.txt,.eml,.docx"
          className="file-input-hidden"
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />
      </div>

      <div className="or-divider">OR</div>

      {/* Paste Complaint Text Button */}
      <button className="btn-paste-spec" onClick={() => setShowPasteModal(true)}>
        📄 Paste Complaint Text / Email
      </button>

      {/* Supported Formats Info Banner */}
      <div className="info-banner-spec">
        <span className="info-icon">ℹ️</span>
        <span>Supported formats: PDF, DOCX, TXT, EML | Max file size: 10MB</span>
      </div>

      {/* Preset Quick Loader Bar */}
      <div className="presets-bar-spec">
        <span className="preset-label">⚡ Quick Samples:</span>
        {SAMPLE_COMPLAINTS.map((s) => (
          <button
            key={s.id}
            className={`preset-chip chip-${s.risk.toLowerCase()}`}
            onClick={() => handleRunPreset(s)}
            disabled={isLoading}
          >
            {s.risk}: {s.product.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Extraction Progress Bar */}
      <div className="progress-section-spec">
        <div className="progress-label-row">
          <span className="progress-title">EXTRACTION PROGRESS</span>
          <span className="progress-pct">{progressPct}%</span>
        </div>
        <div className="progress-track-spec">
          <div
            className="progress-fill-spec"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <p className="progress-subtext">{progressSubtext}</p>
      </div>

      {/* AI Assistant Guidance & Risk Assessment Content */}
      <div className="ai-assistant-card">
        <div className="assistant-header">
          <span className="assistant-avatar">🤖</span>
          <div>
            <strong>AI ASSISTANT & QMS COPILOT</strong>
            <p>Automated first-pass triage & QMS compliance recommendations.</p>
          </div>
        </div>

        {!c ? (
          <p className="assistant-prompt">
            Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.
          </p>
        ) : (
          <div className="copilot-results-spec">
            {/* Field Alert Banner */}
            {isFieldAlert && (
              <div className="field-alert-banner">
                <span className="alert-icon">⚠️</span>
                <div>
                  <strong>21 CFR Part 211 / FDA Field Alert Triggered</strong>
                  <p>Mandatory 15-day Field Alert Notice required for sterility/subpotency/patient safety risk.</p>
                </div>
              </div>
            )}

            {/* Risk Badge & Rationale */}
            <div className="copilot-block">
              <div className="block-title-row">
                <span>AI Risk Level</span>
                <span className={riskBadgeClass(c.risk_classification?.level || c.severity)}>
                  {(c.risk_classification?.level || c.severity || "Medium").toUpperCase()}
                </span>
              </div>
              <p className="block-desc">{c.risk_classification?.justification}</p>
            </div>

            {/* Completeness score */}
            <div className="copilot-block">
              <div className="block-title-row">
                <span>Record Completeness</span>
                <span className="score-pill">{scoreVal}/100</span>
              </div>
              {c.completeness_score?.missing_fields?.length > 0 && (
                <div className="missing-pills">
                  {c.completeness_score.missing_fields.map((m) => (
                    <span key={m} className="pill-missing-sm">{m}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate Matches */}
            {c.duplicate_matches?.length > 0 && (
              <div className="copilot-block">
                <div className="block-title-row">
                  <span>Duplicate Matches</span>
                  <span className="dup-count">{c.duplicate_matches.length} Match(es)</span>
                </div>
                {c.duplicate_matches.map((d, i) => (
                  <p key={i} className="dup-item">
                    <strong>#{d.id?.slice(0, 8)}</strong>: {d.reason}
                  </p>
                ))}
              </div>
            )}

            {/* 5M Root Cause */}
            {c.root_cause_suggestion && (
              <div className="copilot-block">
                <div className="block-title-row">
                  <span>5M Root Cause</span>
                  <span className="m5-tags">
                    {(c.root_cause_suggestion.likely_categories || []).join(", ")}
                  </span>
                </div>
                <p className="block-desc">{c.root_cause_suggestion.reasoning}</p>
              </div>
            )}

            {/* Executive Summary */}
            {c.ai_summary && (
              <div className="copilot-block">
                <div className="block-title-row">
                  <span>Executive Summary</span>
                </div>
                <p className="block-desc">{c.ai_summary}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Log History */}
      {chatLog.length > 0 && (
        <div className="chat-log-box">
          {chatLog.map((msg, i) => (
            <div key={i} className={`chat-bubble bubble-${msg.sender}`}>
              {msg.tool && (
                <div className="tool-badge-pill">
                  🔧 Tool Invoked: {msg.tool}
                </div>
              )}
              <div>
                <strong>{msg.sender === "user" ? "You" : "AI Copilot"}:</strong> {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Bottom Chat Input */}
      <form onSubmit={handleSendChat} className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask me anything about this complaint..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
        />
        <button type="submit" className="btn-chat-send" title="Send message">
          ✈️
        </button>
      </form>
      <span className="chat-disclaimer">AI responses may contain errors. Please verify information.</span>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="modal-backdrop" onClick={() => setShowPasteModal(false)}>
          <div className="modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <h3>Paste Complaint Text / Email</h3>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste raw customer email or quality complaint notice here..."
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPasteModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePasteSubmit}>Process Text with AI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
