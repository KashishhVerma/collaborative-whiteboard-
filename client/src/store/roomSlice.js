import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

export const createRoom = createAsyncThunk("room/create", async (data, { rejectWithValue }) => {
  try { return (await api.post("/rooms/create", data)).data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to create room"); }
});

export const joinRoom = createAsyncThunk("room/join", async (data, { rejectWithValue }) => {
  try { return (await api.post("/rooms/join", data)).data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to join room"); }
});

export const fetchRoom = createAsyncThunk("room/fetch", async (code, { rejectWithValue }) => {
  try { return (await api.get(`/rooms/${code}`)).data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Room not found"); }
});

export const fetchMyRooms = createAsyncThunk("room/fetchMy", async (_, { rejectWithValue }) => {
  try { return (await api.get("/rooms")).data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const roomSlice = createSlice({
  name: "room",
  initialState: {
    current: null,
    myRooms: [],
    activeUsers: [],
    chatMessages: [],
    notes: [],
    loading: false,
    error: null,
  },
  reducers: {
    setActiveUsers: (s, a) => { s.activeUsers = a.payload; },
    addChatMessage: (s, a) => { s.chatMessages.push(a.payload); },
    setChatHistory: (s, a) => { s.chatMessages = a.payload; },
    setNotes: (s, a) => { s.notes = a.payload; },
    addNote: (s, a) => { s.notes.push(a.payload); },
    updateNote: (s, a) => {
      const i = s.notes.findIndex((n) => n.id === a.payload.id);
      if (i !== -1) s.notes[i] = a.payload;
    },
    removeNote: (s, a) => { s.notes = s.notes.filter((n) => n.id !== a.payload); },
    clearRoom: (s) => { s.current = null; s.activeUsers = []; s.chatMessages = []; s.notes = []; s.error = null; },
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(createRoom.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(createRoom.fulfilled, (s, a) => { s.loading = false; s.current = a.payload.room; })
     .addCase(createRoom.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(joinRoom.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(joinRoom.fulfilled, (s, a) => { s.loading = false; s.current = a.payload.room; })
     .addCase(joinRoom.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchRoom.fulfilled, (s, a) => { s.current = a.payload.room; })
     .addCase(fetchMyRooms.fulfilled, (s, a) => { s.myRooms = a.payload.rooms; });
  },
});

export const { setActiveUsers, addChatMessage, setChatHistory, setNotes, addNote, updateNote, removeNote, clearRoom, clearError } = roomSlice.actions;
export default roomSlice.reducer;
