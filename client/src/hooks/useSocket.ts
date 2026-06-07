import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://backend-production-9eab.up.railway.app';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    return () => { socketRef.current?.close(); };
  }, []);

  return socketRef.current;
}
