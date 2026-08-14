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
