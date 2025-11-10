// src/server/types/socket.io.d.ts

declare module 'socket.io' {
  interface Server {
    remoteDisconnect(socketId: string, close: boolean): Promise<void>;
  }
}
