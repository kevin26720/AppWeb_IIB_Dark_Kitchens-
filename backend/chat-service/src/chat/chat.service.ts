import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(content: string, userId: number, room: string) {
    return this.prisma.message.create({
      data: {
        content,
        userId,
        room,
      },
    });
  }

  async getMessages(room: string, limit: number = 50) {
    return this.prisma.message.findMany({
      where: { room },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async getUserConversations() {
    const distinctRooms = await this.prisma.message.findMany({
      distinct: ['room'],
      select: { room: true },
    });
    return distinctRooms.map(r => r.room);
  }
}
