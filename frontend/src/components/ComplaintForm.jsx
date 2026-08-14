import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitTextComplaint, submitFileComplaint } from "../store/complaintSlice.js";

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { activeComplaint, status } = useSelector((s) => s.complaints);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState(null);

  const isLoading = status === "loading";

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    dispatch(submitTextComplaint(rawText));
  };

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) dispatch(submitFileComplaint(f));
  };

  const c = activeComplaint || {};

  return (
    <div className="panel">
      <h2>Log Customer Complaint</h2>

      {/* Intake: paste text or upload a PDF/email export */}
      <form onSubmit={handleSubmitText}>
        <label>Paste complaint email / description</label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the customer's email or complaint text here..."
        />
        <button className="btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Processing with AI..." : "Analyze Complaint"}
        </button>
      </form>

      <label>Or upload a PDF / email file</label>
      <input type="file" accept=".pdf,.txt,.eml" onChange={handleFileUpload} />

      <div className="ai-section">
        <h3>Extracted Complaint Details</h3>
        <label>Customer Name</label>
        <input value={c.customer_name || ""} readOnly />

        <label>Product Name</label>
        <input value={c.product_name || ""} readOnly />

        <label>Batch / Lot Number</label>
        <input value={c.batch_number || ""} readOnly />

        <label>Complaint Type</label>
        <input value={c.complaint_type || ""} readOnly />

        <label>Complaint Description</label>
        <textarea value={c.complaint_description || ""} readOnly />
      </div>
    </div>
  );
}
