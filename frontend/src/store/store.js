import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "./complaintSlice.js";

export const store = configureStore({
  reducer: {
    complaints: complaintReducer,
  },
});
