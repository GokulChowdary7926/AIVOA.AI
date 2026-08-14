import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { submitComplaintText, submitComplaintFile, listComplaints } from "../api/api.js";

export const submitTextComplaint = createAsyncThunk(
  "complaints/submitText",
  async (text) => submitComplaintText(text)
);

export const submitFileComplaint = createAsyncThunk(
  "complaints/submitFile",
  async (file) => submitComplaintFile(file)
);

export const fetchComplaints = createAsyncThunk(
  "complaints/fetchAll",
  async () => listComplaints()
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    items: [],
    activeComplaint: null,   // populated after AI processing -> drives the form + copilot panel
    status: "idle",          // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearActiveComplaint(state) {
      state.activeComplaint = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTextComplaint.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(submitTextComplaint.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeComplaint = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(submitTextComplaint.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(submitFileComplaint.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(submitFileComplaint.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeComplaint = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(submitFileComplaint.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { clearActiveComplaint } = complaintSlice.actions;
export default complaintSlice.reducer;
