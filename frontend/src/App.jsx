import React, { useState } from "react";
import ComplaintForm from "./components/ComplaintForm.jsx";
import AICopilotPanel from "./components/AICopilotPanel.jsx";
import ComplaintList from "./components/ComplaintList.jsx";
import ComplaintDetailModal from "./components/ComplaintDetailModal.jsx";
import { SAMPLE_COMPLAINTS } from "./data/sampleData.js";
import { useDispatch } from "react-redux";
import { submitTextComplaint } from "./store/complaintSlice.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("workspace"); // workspace | history | library
  const dispatch = useDispatch();

  const handleRunSample = (sample) => {
    setActiveTab("workspace");
    dispatch(submitTextComplaint(sample.text));
  };

  return (
    <div className="app-container">
      {/* Top Header Navbar */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">🛡️</div>
          <div>
            <h1 className="brand-title">AIVOA.AI — Customer Complaint Management System</h1>
            <p className="brand-subtitle">
              Pharmaceutical QMS · AI Triage Agent · GMP & 21 CFR Part 211 Compliance
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === "workspace" ? "active" : ""}`}
            onClick={() => setActiveTab("workspace")}
          >
            📋 Log Complaint & Copilot
          </button>
          <button
            className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            🗂️ Audit Log & History
          </button>
          <button
            className={`nav-tab ${activeTab === "library" ? "active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            🧪 Sample Scenarios Library
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {activeTab === "workspace" && (
          <div className="app-shell">
            <ComplaintForm />
            <AICopilotPanel />
          </div>
        )}

        {activeTab === "history" && (
          <div className="single-view-shell">
            <ComplaintList />
          </div>
        )}

        {activeTab === "library" && (
          <div className="single-view-shell">
            <div className="panel library-panel">
              <div className="panel-header">
                <h2>Pharmaceutical Sample Complaints Library</h2>
                <span className="subtitle-tag">Realistic GMP Failure Test Cases</span>
              </div>
              <p className="library-intro">
                Click <strong>"Run AI Agent Analysis"</strong> on any sample below to automatically execute the 7-node LangGraph pipeline and populate the Copilot panel.
              </p>

              <div className="library-grid">
                {SAMPLE_COMPLAINTS.map((sample) => (
                  <div key={sample.id} className={`library-card card-${sample.risk.toLowerCase()}`}>
                    <div className="card-top">
                      <span className={`badge ${sample.badgeClass}`}>{sample.risk} RISK</span>
                      <span className="type-tag">{sample.type}</span>
                    </div>
                    <h3>{sample.title}</h3>
                    <div className="sample-meta">
                      <span><strong>Product:</strong> {sample.product}</span>
                      <span><strong>Batch:</strong> {sample.batch}</span>
                      <span><strong>Customer:</strong> {sample.customer}</span>
                    </div>
                    <p className="sample-text-preview">{sample.text}</p>
                    <button
                      className="btn-primary btn-block"
                      onClick={() => handleRunSample(sample)}
                    >
                      🚀 Run AI Agent Analysis on this Sample
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Inspection Modal */}
      <ComplaintDetailModal />
    </div>
  );
}
