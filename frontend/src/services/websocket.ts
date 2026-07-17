import { io, Socket } from 'socket.io-client';
import type { Alert, ClimateReading } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ClimateReadingEvent {
  reading: ClimateReading;
  sensor: {
    id: string;
    sensor_name: string | null;
    location: string | null;
    facility_id: string;
  };
}

let socket: Socket | null = null;

export function connectClimateSocket(token: string) {
  if (socket?.connected) return socket;

  socket?.disconnect();
  socket = io(API_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectClimateSocket() {
  socket?.disconnect();
  socket = null;
}

export function getClimateSocket() {
  return socket;
}

export function onClimateReading(handler: (payload: ClimateReadingEvent) => void) {
  socket?.on('climate:reading', handler);
  return () => {
    socket?.off('climate:reading', handler);
  };
}

export function onClimateAlert(handler: (payload: Alert) => void) {
  socket?.on('climate:alert', handler);
  return () => {
    socket?.off('climate:alert', handler);
  };
}
