import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = (req: NextApiRequest, res: NextApiResponse & { socket: { server: NetServer & { io?: ServerIO } } }) => {
  if (!res.socket?.server?.io) {
    const path = '/api/socket/io'
    const httpServer: NetServer = res.socket.server
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    })
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join interview room
      socket.on('join-interview', (interviewId: string) => {
        socket.join(`interview-${interviewId}`)
        console.log(`Socket ${socket.id} joined interview ${interviewId}`)
      })

      // Leave interview room
      socket.on('leave-interview', (interviewId: string) => {
        socket.leave(`interview-${interviewId}`)
        console.log(`Socket ${socket.id} left interview ${interviewId}`)
      })

      // Handle interview events
      socket.on('interview-started', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('interview-started', data)
      })

      socket.on('interview-ended', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('interview-ended', data)
      })

      socket.on('question-asked', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('question-asked', data)
      })

      socket.on('response-given', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('response-given', data)
      })

      socket.on('evaluation-completed', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('evaluation-completed', data)
      })

      // Handle candidate interactions
      socket.on('candidate-typing', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('candidate-typing', data)
      })

      socket.on('candidate-stopped-typing', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('candidate-stopped-typing', data)
      })

      // Handle notes and observations
      socket.on('interviewer-note', (data) => {
        socket.to(`interview-${data.interviewId}`).emit('interviewer-note', data)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }
  
  res.end()
}

export default ioHandler