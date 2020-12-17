import { io } from 'socket.io-client'

const it = process.env.NODE_ENV === 'production' ? io() : io('http://localhost:23333/')
export default it
