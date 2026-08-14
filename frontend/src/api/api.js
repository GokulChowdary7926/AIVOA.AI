import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const submitComplaintText = (text) =>
  axios.post(`${API_BASE}/api/complaints/from-text`, { text }).then((r) => r.data);

export const submitComplaintFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios
    .post(`${API_BASE}/api/complaints/from-file`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const listComplaints = () =>
  axios.get(`${API_BASE}/api/complaints`).then((r) => r.data);

export const getComplaint = (id) =>
  axios.get(`${API_BASE}/api/complaints/${id}`).then((r) => r.data);

export const updateComplaint = (id, data) =>
  axios.put(`${API_BASE}/api/complaints/${id}`, data).then((r) => r.data);

export const seedSampleComplaints = () =>
  axios.post(`${API_BASE}/api/complaints/seed-samples`).then((r) => r.data);

export const sendCopilotChat = ({ message = "", file = null, activeComplaintId = null }) => {
  if (file) {
    const form = new FormData();
    form.append("file", file);
    if (message) form.append("message", message);
    if (activeComplaintId) form.append("active_complaint_id", activeComplaintId);
    return axios
      .post(`${API_BASE}/api/complaints/copilot/chat-file`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  }
  return axios
    .post(`${API_BASE}/api/complaints/copilot/chat`, {
      message,
      active_complaint_id: activeComplaintId,
    })
    .then((r) => r.data);
};
