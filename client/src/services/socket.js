import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("/", {
      auth: { token: localStorage.getItem("ss_token") },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socket.on("connect",       () => console.log("🔌 Socket:", socket.id));
    socket.on("disconnect",    r  => console.log("🔌 Disconnected:", r));
    socket.on("connect_error", e  => console.warn("Socket error:", e.message));
  }
  return socket;
};

export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
export const subscribeToStock   = sym => getSocket().emit("subscribe",   sym.toUpperCase());
export const unsubscribeFromStock = sym => getSocket().emit("unsubscribe", sym.toUpperCase());
