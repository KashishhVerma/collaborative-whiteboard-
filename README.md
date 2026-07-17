# CollabBoard 🎨

Real-time collaborative whiteboard — MERN + Socket.io + Vite + Tailwind CSS.

---

## Tech Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Frontend   | React 18, Vite, Redux Toolkit, Tailwind   |
| Backend    | Node.js, Express, Socket.io               |
| Database   | MongoDB Atlas                             |
| Auth       | JWT + bcrypt                              |
| Deploy     | Vercel (frontend) + Render (backend)      |

---

## Features

- 🎨 Real-time whiteboard — pen, eraser, shapes, arrows, undo/redo
- 👥 Live cursors with names
- 💬 Persistent chat sidebar
- 🗒️ Draggable sticky notes
- 🖼️ Image upload (drag + resize)
- ✨ AI Diagram Generator (Groq / Gemini / OpenRouter)
- ⏱️ Timer widget
- 😊 Emoji reactions
- 🔗 Share link
- 🌙 Dark / Light theme
- 💾 Auto-save on every stroke

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Server .env

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabboard
JWT_SECRET=any_long_random_string_here
CLIENT_URL=http://localhost:5173

# AI Keys (at least one required for AI Diagram feature)
GROQ_API_KEY=gsk_xxxx          # Free at console.groq.com
GEMINI_API_KEY=AIxxxx          # Free at aistudio.google.com
OPENROUTER_API_KEY=sk-or-xxxx  # Free at openrouter.ai
```

### 3. Client .env

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open `http://localhost:5173`

---



## Project Structure

```
collabboard/
├── server/
│   └── src/
│       ├── index.js              # Express + Socket.io entry
│       ├── models/
│       │   ├── User.js
│       │   └── Room.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── room.js
│       │   └── ai.js             # AI diagram with fallback
│       ├── middleware/
│       │   └── auth.js
│       └── socket/
│           └── socketHandlers.js
│
└── client/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── AuthPage.jsx
        │   ├── DashboardPage.jsx
        │   └── BoardPage.jsx     # Main board + all features
        ├── components/
        │   ├── canvas/
        │   │   ├── Canvas.jsx    # Drawing engine
        │   │   └── Toolbar.jsx
        │   ├── chat/
        │   │   └── Chat.jsx
        │   ├── room/
        │   │   ├── ActiveUsers.jsx
        │   │   └── StickyNotes.jsx
        │   └── ui/
        │       ├── Loader.jsx
        │       └── Primitives.jsx
        ├── store/
        │   ├── store.js
        │   ├── authSlice.js
        │   ├── roomSlice.js
        │   └── canvasSlice.js
        └── services/
            ├── api.js
            └── socket.js
```



## AI Diagram API Keys (Free)

| Provider   | URL                        | Free Limit          |
|------------|----------------------------|---------------------|
| Groq       | console.groq.com           | 14,400 req/day      |
| Gemini     | aistudio.google.com        | 1,500 req/day       |
| OpenRouter | openrouter.ai              | Select free models  |
