import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { ChatService } from './chat.service';
import { createAdapter } from '@socket.io/redis-adapter';
import * as jwt from 'jsonwebtoken';

const wsPort = parseInt(process.env.WS_PORT || '4005', 10);

@WebSocketGateway(wsPort, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    const pubClient = this.redisService.getClient();
    const subClient = this.redisService.getSubClient();

    server.adapter(createAdapter(pubClient, subClient));

    this.redisService.subscribe('order:notifications', (message) => {
      try {
        const payload = JSON.parse(message);
        if (payload.userId) {
          const room = `room_client_${payload.userId}`;
          this.server.to(room).emit('order:update', payload);
        }
      } catch (err) {
        console.error('Error parsing order notification:', err);
      }
    });
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'supersecret');
      const tokenValue = typeof token === 'string' && token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      
      const payload = jwt.verify(tokenValue as string, secret) as jwt.JwtPayload;
      client.data.user = payload;
    } catch (error) {
      console.error('Socket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // optional logging
  }

  @SubscribeMessage('chat:join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  @SubscribeMessage('chat:leave-room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
  }

  @SubscribeMessage('chat:join-admin-room')
  handleJoinAdminRoom(client: Socket) {
    client.join('admin_global_room');
  }

  @SubscribeMessage('chat:message')
  async handleMessage(client: Socket, payload: { content: string; room: string }) {
    const user = client.data.user;
    if (user && user.sub) {
      const savedMessage = await this.chatService.saveMessage(payload.content, parseInt(user.sub, 10), payload.room);
      this.server.to(payload.room).emit('chat:message', savedMessage);
      this.server.emit('chat:conversations-updated');
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(client: Socket, room: string) {
    client.to(room).emit('chat:typing', { userId: client.data.user?.sub });
  }

  @SubscribeMessage('chat:stop-typing')
  handleStopTyping(client: Socket, room: string) {
    client.to(room).emit('chat:stop-typing', { userId: client.data.user?.sub });
  }
}
