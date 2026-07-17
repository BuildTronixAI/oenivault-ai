const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** Phase 2 will wire Socket.io here. Stub keeps import path stable. */
export function createClimateSocket(_token: string) {
  console.info('[websocket] Climate socket reserved for Phase 2', { API_URL });
  return null;
}
