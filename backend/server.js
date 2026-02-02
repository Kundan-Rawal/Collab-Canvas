import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow connection from anywhere
    methods: ["GET", "POST"]
  }
});

// --- THE MEMORY (This is what you are missing) ---
let drawingHistory = []; 
let redoStack = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Send existing history to new user
  socket.emit('load_history', drawingHistory);

  // 2. Live Drawing (Broadcasting pixels)
  socket.on('draw_line', (data) => {
    // Just pass the data along. 
    // The 'data' object ALREADY contains the color and width from the client.
    socket.broadcast.emit('draw_line', data);
  });

  
  // 3. Save Stroke (The "Commit" Action)
  socket.on('end_stroke', (data) => {
    drawingHistory.push(data);
    
    // CRITICAL: If user draws something new, Redo is invalid.
    redoStack = []; // Clear the redo stack
    
    // Optional: Log to see it happening
    console.log(`Saved. History: ${drawingHistory.length}, Redo: ${redoStack.length}`);
  });

  // 4. Handle Undo
  socket.on('undo', () => {
    console.log("Undo requested");
    if (drawingHistory.length > 0) {
      const lastStroke = drawingHistory.pop(); // 1. Remove from history
      redoStack.push(lastStroke);              // 2. SAVE to Redo Stack (You were missing this!)
      
      // Tell everyone to redraw
      io.emit('clear_and_redraw', drawingHistory);
    }
  });

  socket.on('redo', () => {
    if (redoStack.length > 0) {
      const strokeToRestore = redoStack.pop(); // Remove from Redo
      drawingHistory.push(strokeToRestore);    // Add back to History
      
      io.emit('clear_and_redraw', drawingHistory);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});