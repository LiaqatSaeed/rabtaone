import { Server } from "socket.io";
import { verifyToken } from "@/lib/jwt";
import { chatService } from "@/services/chat-service";

export function createSocketServer(httpServer: unknown) {
  const io = new Server(httpServer as any, {
    path: process.env.SOCKET_IO_PATH ?? "/api/socket",
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Unauthorized"));
      const payload = verifyToken(token);
      (socket as any).user = payload;
      return next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("chat:message", async (data: { orderId: string; body: string }) => {
      const user = (socket as any).user as { sub: string };
      const thread = await chatService.getThread(data.orderId);
      const message = await chatService.addMessage({
        orderId: data.orderId,
        threadId: thread.id,
        senderId: user.sub,
        body: data.body,
      });
      io.to(`order:${data.orderId}`).emit("chat:message", message);
    });
  });

  return io;
}
