import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  const token = localStorage.getItem('token')
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 2000,
      timeout: 10000,
    })
  }
  return socket
}

export const connectSocket = (): Socket => {
  const s = getSocket()
  if (!s.connected) {
    s.auth = { token: localStorage.getItem('token') }
    s.connect()
  }
  return s
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
