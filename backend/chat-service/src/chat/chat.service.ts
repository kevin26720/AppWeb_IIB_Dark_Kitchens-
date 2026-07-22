import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ChatService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-123456789012';
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    if (!encryptedText.startsWith('ENC:')) {
      return encryptedText;
    }
    
    try {
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const content = parts[3];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(content, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error descifrando mensaje:', error);
      return '[Mensaje no disponible]';
    }
  }

  async saveMessage(content: string, userId: number, room: string) {
    const encryptedContent = this.encrypt(content);
    return this.prisma.message.create({
      data: {
        content: encryptedContent,
        userId,
        room,
      },
    });
  }

  async getMessages(room: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      where: { room },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    
    return messages.map(msg => ({
      ...msg,
      content: this.decrypt(msg.content)
    }));
  }

  async getUserConversations() {
    const distinctRooms = await this.prisma.message.findMany({
      distinct: ['room'],
      select: { room: true },
    });
    return distinctRooms.map(r => ({ room: r.room }));
  }
}
