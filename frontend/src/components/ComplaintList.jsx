import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchComplaints,
  setActiveComplaint,
  setSelectedComplaint,
  seedDatabaseSamples,
} from "../store/complaintSlice.js";

const riskBadgeClass = (level) => {
  switch ((level || "").toLowerCase()) {
    case "low": return "badge badge-low";
    case "medium": return "badge badge-medium";
    case "high": return "badge badge-high";
    case "critical": return "badge badge-critical";
    default: return "badge";
  }
};

export default function ComplaintList() {
  const dispatch = useDispatch();
  const { items, activeComplaint } = useSelector((s) => s.complaints);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  const handleSeedSamples = () => {
    dispatch(seedDatabaseSamples());
  };

  const handleSelectActive = (item) => {
    dispatch(setActiveComplaint(item));
  };

  const handleViewDetail = (item) => {
    dispatch(setSelectedComplaint(item));
  };

  const filteredItems = items.filter((item) => {
    const risk = (item.risk_classification?.level || item.severity || "").toUpperCase();
    if (riskFilter !== "ALL" && risk !== riskFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.customer_name || "").toLowerCase().includes(term) ||
      (item.product_name || "").toLowerCase().includes(term) ||
      (item.batch_number || "").toLowerCase().includes(term) ||
      (item.complaint_type || "").toLowerCase().includes(term) ||
      (item.complaint_description || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Audit Log & Logged Complaints History</h2>
          <span className="subtitle-tag">GMP Compliant Central Complaint Repository</span>
        </div>
        <button className="btn-secondary btn-sm" onClick={handleSeedSamples}>
          🌱 Populate Sample Database
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="filter-controls">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search customer, product, batch number, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="risk-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* Complaints Table */}
      {filteredItems.length === 0 ? (
        <div className="empty-list-box">
          <p>No complaints found matching criteria.</p>
          <button className="btn-primary btn-sm" onClick={handleSeedSamples}>
            Click here to seed sample database complaints
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product / Batch</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Completeness</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((c) => {
                const risk = c.risk_classification?.level || c.severity || "Medium";
                const isActive = activeComplaint?.id === c.id;

                return (
                  <tr key={c.id} className={isActive ? "active-row" : ""}>
                    <td>
                      <code className="id-code">{c.complaint_number || `#${c.id?.slice(0, 6)}`}</code>
                    </td>
                    <td>
                      <strong>{c.product_name || "Unknown Product"}</strong>
                      <br />
                      <span className="batch-tag">Batch: {c.batch_number || "N/A"}</span>
                    </td>
                    <td>{c.customer_name || "Pharma Customer"}</td>
                    <td>{c.complaint_type || "Quality Defect"}</td>
                    <td>
                      <span className={riskBadgeClass(risk)}>{risk}</span>
                      {c.regulatory_reportable && (
                        <span className="alert-dot" title="21 CFR Field Alert Required">
                          ⚠️
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="score-pill">
                        {c.completeness_score?.score ?? 85}/100
                      </span>
                    </td>
                    <td>
                      <span className="status-chip">{c.status || "Open"}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action"
                          title="Load into Active Form & Copilot"
                          onClick={() => handleSelectActive(c)}
                        >
                          ⚡ Load
                        </button>
                        <button
                          className="btn-action btn-outline"
                          title="Inspect Full AI Output"
                          onClick={() => handleViewDetail(c)}
                        >
                          👁️ View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
