import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { leadsRouter } from './routes/leads';
import { propertiesRouter } from './routes/properties';
import { dashboardRouter } from './routes/dashboard';
import { webhookRouter } from './routes/webhook';
import { usersRouter } from './routes/users';
import { authMiddleware } from './middleware/auth';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

export const prisma = new PrismaClient();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/properties', authMiddleware, propertiesRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/users', authMiddleware, usersRouter);

io.on('connection', (socket) => {
  console.log('cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('cliente desconectado:', socket.id));
});

app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`servidor corriendo en puerto ${PORT}`);
});
