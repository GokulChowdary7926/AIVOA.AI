import React from "react";
import ComplaintForm from "./components/ComplaintForm.jsx";
import AICopilotPanel from "./components/AICopilotPanel.jsx";

export default function App() {
  return (
    <div>
      <header style={{ padding: "20px 24px 0" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          AIVOA — Customer Complaint Management System
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Pharmaceutical QMS · Customer Complaint Module
        </p>
      </header>
      <div className="app-shell">
        <ComplaintForm />
        <AICopilotPanel />
      </div>
    </div>
  );
}
