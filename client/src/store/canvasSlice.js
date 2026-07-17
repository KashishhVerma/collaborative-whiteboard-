import { createSlice } from "@reduxjs/toolkit";

const canvasSlice = createSlice({
  name: "canvas",
  initialState: {
    tool: "pen",       // pen | eraser | line | rect | circle | arrow | diamond | text
    color: "#7c5cfc",
    strokeWidth: 3,
    fillColor: "transparent",
  },
  reducers: {
    setTool: (s, a) => { s.tool = a.payload; },
    setColor: (s, a) => { s.color = a.payload; },
    setStrokeWidth: (s, a) => { s.strokeWidth = a.payload; },
    setFillColor: (s, a) => { s.fillColor = a.payload; },
  },
});

export const { setTool, setColor, setStrokeWidth, setFillColor } = canvasSlice.actions;
export default canvasSlice.reducer;
