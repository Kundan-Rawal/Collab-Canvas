import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import CursorOverlay from "./CursorOverlay";
import "./Canvas.css"; // <--- Import the CSS here

const Canvas = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socketRef = useRef(null);

  // UI State
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);

  // Path Recorders
  const currentPath = useRef([]);
  const lastXCordinate = useRef(0);
  const lastYCordinate = useRef(0);

  useEffect(() => {

    const serverUrl =
      import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    socketRef.current = io(serverUrl);

    // 2. Handle Live Drawing (From others)
    socketRef.current.on(
      "draw_line",
      ({ prevX, prevY, currentX, currentY, color, width }) => {
        if (!contextRef.current) return;
        const ctx = contextRef.current;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      },
    );

    // 3. Handle Clear & Redraw (Undo/Redo)
    socketRef.current.on("clear_and_redraw", (history) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      history.forEach((stroke) => {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;

        if (stroke.points.length > 0) {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          stroke.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
        ctx.closePath();
      });
    });

    socketRef.current.on("load_history", (history) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;

      // Wipe board (just in case)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Replay History
      history.forEach((stroke) => {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;

        if (stroke.points.length > 0) {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          stroke.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
        ctx.closePath();
      });
    });

    // 4. Canvas Initialization
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `100%`;
    canvas.style.height = `100%`;

    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

    socketRef.current.on("get_canvas_state", () => {
       // If the server doesn't auto-send, we might need to ask. 
       // But typically, we just listen for the data:
    });
    
    // 5. Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        socketRef.current.emit("undo");
      }
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        socketRef.current.emit("redo");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // --- MOUSE HELPERS ---
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getMousePos(e);

    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = lineWidth;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);

    setIsDrawing(true);
    currentPath.current = [{ x, y }];
    lastXCordinate.current = x;
    lastYCordinate.current = y;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getMousePos(e);

    // Draw Locally
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();

    // Record Locally
    currentPath.current.push({ x, y });

    // Broadcast
    if (socketRef.current) {
      socketRef.current.emit("draw_line", {
        prevX: lastXCordinate.current,
        prevY: lastYCordinate.current,
        currentX: x,
        currentY: y,
        color: color,
        width: lineWidth,
      });
    }

    lastXCordinate.current = x;
    lastYCordinate.current = y;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);

    if (currentPath.current.length > 0 && socketRef.current) {
      socketRef.current.emit("end_stroke", {
        points: currentPath.current,
        color: color,
        width: lineWidth,
      });
      currentPath.current = [];
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePos(e);

    if (socketRef.current) {
      socketRef.current.emit("cursor_move", { x, y });
    }

    if (isDrawing) {
      draw(e);
    }
  };

  return (
    <div className="canvas-container">
      {/* --- TOOLBAR UI --- */}
      <div className="toolbar">
        {/* Color Picker */}
        <input
          type="color"
          className="color-picker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        {/* Size Slider */}
        <div className="size-group">
          <span className="size-label">Size:</span>
          <input
            type="range"
            className="size-slider"
            min="2"
            max="30"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
        </div>

        {/* Eraser */}
        <button
          className={`eraser-btn ${color === "#FFFFFF" ? "active" : ""}`}
          onClick={() => setColor("#FFFFFF")}
        >
          Eraser
        </button>

        <div className="divider"></div>

        <button
          className="icon-btn"
          onClick={() => socketRef.current.emit("undo")}
          title="Undo (Ctrl+Z)"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          className="icon-btn"
          onClick={() => socketRef.current.emit("redo")}
          title="Redo (Ctrl+Y)"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7" />
          </svg>
        </button>
      </div>

      {/* --- CURSOR OVERLAY --- */}
      <CursorOverlay socket={socketRef.current} />

      {/* --- CANVAS --- */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="canvas"
      />
    </div>
  );
};

export default Canvas;
