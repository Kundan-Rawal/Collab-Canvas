# Collaborative Whiteboard Architecture

## 1. System Overview
This project is a real-time collaborative drawing application built on the **MERN** stack principles (React + Node.js) using **WebSockets** for low-latency communication. The core challenge was to maintain a synchronized state across multiple clients while ensuring a smooth, jitter-free drawing experience (60fps).

## 2. Technology Stack

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Frontend** | React.js + Vite | Component-based structure for UI overlays (Toolbar, Cursors). |
| **Graphics** | HTML5 Canvas API | Raw performance. Chosen over heavy libraries (Fabric.js) to maintain lightweight control over pixel rendering. |
| **Backend** | Node.js + Express | Non-blocking I/O ideal for handling high-concurrency WebSocket connections. |
| **Communication** | Socket.io | Robust event-based communication with automatic reconnection and room support. |
| **Deployment** | Vercel (Client) + Render (Server) | Separation of concerns for scalable hosting. |

## 3. Core Architecture & Data Flow

### A. Real-Time Synchronization Strategy
To minimize latency perception, I implemented an **Optimistic UI** pattern:
* **Local Draw:** When a user draws, pixels are rendered immediately on their local canvas.
* **Broadcast:** Simultaneously, coordinates are emitted via `socket.emit('draw_line')`.
* **Remote Render:** Other clients receive these coordinates and replicate the drawing command.

### B. The "Movie Reel" History (Undo/Redo)
State consistency is the hardest part of a multi-user whiteboard. I solved this using a **Centralized Server Authority** model with a **Two-Stack Algorithm**.

**Data Structure:**
* `drawingHistory`: An array of completed stroke objects (Color, Width, Points[]).
* `redoStack`: A temporary holding stack for undone actions.

**The Logic:**
* **Undo:** Server moves the last stroke from `History` -> `Redo`.
* **Redo:** Server moves the stroke from `Redo` -> `History`.
* **The "Burn" Rule:** If a user performs an Undo and then draws a *new* line, the `redoStack` is strictly cleared to prevent state divergence.
* **Synchronization:** On any state change, the server broadcasts the *entire* history. Clients wipe their board and replay the movie reel. This guarantees eventual consistency.

## 4. Key Engineering Challenges Solved

### 1. Coordinate Drift (High DPI & Resizing)
**Problem:** On different screen sizes or Retina displays, the mouse cursor position (`clientX`) often drifted away from the actual drawn ink.

**Solution:** I implemented a dynamic coordinate mapping function that calculates the ratio between the internal bitmap resolution and the visual CSS display size:

```javascript
scaleX = canvas.width / rect.width;
scaleY = canvas.height / rect.height;
```

### 2. Ghost Cursors (User Presence)
**Problem** Rendering other users' cursors directly onto the canvas would make them permanent pixels (part of the drawing).

**Solution** I implemented a Layered Architecture.
Layer 1 (Bottom): The <canvas> element for persistent ink.
Layer 2 (Top): A transparent HTML <div> overlay.
Cursors are rendered as absolute-positioned DOM elements in Layer 2. This isolates "presence" from "content," ensuring that clearing the board doesn't delete users.

## 5. Scalability & Future Improvements

Currently, the state is held in Server Memory (RAM) for maximum speed. To scale this application to production levels, I would introduce.
Redis Adapter: To allow scaling across multiple Node.js processes/instances.
Throttling: Limit mousemove events to 30-60ms to reduce network bandwidth consumption.
Snapshotting: Instead of replaying 10,000 strokes on load, save a base image every 50 strokes to the database (MongoDB/S3) and only replay the delta.