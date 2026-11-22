import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_PUBLIC_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true
})

export default socket