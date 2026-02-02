import { useState, useEffect } from "react";

const CursorOverlay = ({ socket }) => {
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    if (!socket) return;

    // Listen for other users moving their mouse
    socket.on("cursor_move", ({ id, x, y }) => {
      setCursors((prev) => ({
        ...prev,
        [id]: { x, y }, // Update or add this user's cursor
      }));
    });
  }, [socket]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // CRITICAL: Lets clicks pass through to the canvas!
        zIndex: 10, // Must be above the canvas
      }}
    >
      {Object.entries(cursors).map(([id, pos]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            transition: "top 0.1s linear, left 0.1s linear", // Smooth animation
          }}
        >
          {/* The Cursor Dot */}
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "red", // You can randomize colors later
              borderRadius: "50%",
              transform: "translate(-50%, -50%)", // Center exactly on point
            }}
          />

          {/* Optional: The User Label */}
          <div
            style={{
              marginLeft: "10px",
              background: "red",
              color: "white",
              padding: "2px 5px",
              fontSize: "10px",
              borderRadius: "3px",
            }}
          >
            User
          </div>
        </div>
      ))}
    </div>
  );
};

export default CursorOverlay;
