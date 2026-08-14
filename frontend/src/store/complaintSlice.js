import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  submitComplaintText,
  submitComplaintFile,
  listComplaints,
  updateComplaint,
  seedSampleComplaints,
  sendCopilotChat,
} from "../api/api.js";

export const submitTextComplaint = createAsyncThunk(
  "complaints/submitText",
  async (text) => submitComplaintText(text)
);

export const submitFileComplaint = createAsyncThunk(
  "complaints/submitFile",
  async (file) => submitComplaintFile(file)
);

export const sendCopilotMessage = createAsyncThunk(
  "complaints/sendCopilotMessage",
  async ({ message, file, activeComplaintId }) =>
    sendCopilotChat({ message, file, activeComplaintId })
);

export const fetchComplaints = createAsyncThunk(
  "complaints/fetchAll",
  async () => listComplaints()
);

export const saveComplaintEdits = createAsyncThunk(
  "complaints/saveEdits",
  async ({ id, data }) => updateComplaint(id, data)
);

export const seedDatabaseSamples = createAsyncThunk(
  "complaints/seedSamples",
  async () => seedSampleComplaints()
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    items: [],
    activeComplaint: null,   // populated after AI processing -> drives the form + copilot panel
    selectedComplaint: null, // for detail modal view
    status: "idle",          // idle | loading | succeeded | failed
    activeStep: 0,           // 0 to 7 step indicator during AI run
    error: null,
  },
  reducers: {
    clearActiveComplaint(state) {
      state.activeComplaint = null;
    },
    setActiveComplaint(state, action) {
      state.activeComplaint = action.payload;
    },
    setSelectedComplaint(state, action) {
      state.selectedComplaint = action.payload;
    },
    setActiveStep(state, action) {
      state.activeStep = action.payload;
    },
    updateActiveComplaintField(state, action) {
      if (state.activeComplaint) {
        const { field, value } = action.payload;
        state.activeComplaint[field] = value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTextComplaint.pending, (state) => {
        state.status = "loading";
        state.activeStep = 1;
        state.error = null;
      })
      .addCase(submitTextComplaint.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeStep = 7;
        state.activeComplaint = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(submitTextComplaint.rejected, (state, action) => {
        state.status = "failed";
        state.activeStep = 0;
        state.error = action.error.message;
      })
      .addCase(submitFileComplaint.pending, (state) => {
        state.status = "loading";
        state.activeStep = 1;
        state.error = null;
      })
      .addCase(submitFileComplaint.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeStep = 7;
        state.activeComplaint = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(submitFileComplaint.rejected, (state, action) => {
        state.status = "failed";
        state.activeStep = 0;
        state.error = action.error.message;
      })
      .addCase(sendCopilotMessage.pending, (state) => {
        state.status = "loading";
        state.activeStep = 1;
        state.error = null;
      })
      .addCase(sendCopilotMessage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeStep = 7;
        if (action.payload.active_complaint) {
          state.activeComplaint = action.payload.active_complaint;
          const idx = state.items.findIndex((i) => i.id === action.payload.active_complaint.id);
          if (idx >= 0) {
            state.items[idx] = action.payload.active_complaint;
          } else {
            state.items.unshift(action.payload.active_complaint);
          }
        }
      })
      .addCase(sendCopilotMessage.rejected, (state, action) => {
        state.status = "failed";
        state.activeStep = 0;
        state.error = action.error.message;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(saveComplaintEdits.fulfilled, (state, action) => {
        state.activeComplaint = action.payload;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(seedDatabaseSamples.fulfilled, (state, action) => {
        state.items = action.payload;
        if (action.payload.length > 0) {
          state.activeComplaint = action.payload[0];
        }
      });
  },
});

export const {
  clearActiveComplaint,
  setActiveComplaint,
  setSelectedComplaint,
  setActiveStep,
  updateActiveComplaintField,
} = complaintSlice.actions;

export default complaintSlice.reducer;
