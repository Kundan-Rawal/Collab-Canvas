# Real-Time Collaborative Whiteboard

A MERN stack application allowing multiple users to draw, undo/redo, and see each other's cursors in real-time.

Deployed Backend URL : https://collab-canvas-4wjs.onrender.com
Deployed Frontend URL : https://collab-canvas-kappa-eight.vercel.app/

## Features
- 🎨 **Real-time Drawing:** Low-latency synchronization using Socket.io.
- ↩️ **Global Undo/Redo:** Shared history stack across all connected users.
- 👥 **Presence:** Live "Ghost Cursors" showing other users' positions.
- 🛠 **Tools:** Adjustable brush size, color picker, and eraser.
- 📐 **Responsive:** Dynamic coordinate mapping for all screen sizes.

## Tech Stack
- **Frontend:** React, HTML5 Canvas, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Architecture:** In-Memory State Management for speed.

## How to Run Locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/Kundan-Rawal/Collab-Canvas.git
   cd Collab-Canvas
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```