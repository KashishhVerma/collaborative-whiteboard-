import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import roomReducer from "./roomSlice.js";
import canvasReducer from "./canvasSlice.js";

export const store = configureStore({
  reducer: { auth: authReducer, room: roomReducer, canvas: canvasReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
