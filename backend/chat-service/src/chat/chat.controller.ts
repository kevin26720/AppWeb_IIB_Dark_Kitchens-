import { Controller, Get, Post, Body, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('user/conversations')
  async getUserConversations(@Headers('x-user-role') role: string) {
    if (role !== 'ADMIN') {
      throw new UnauthorizedException('Admin only');
    }
    return this.chatService.getUserConversations();
  }

  @Get(':room')
  async getMessages(
    @Param('room') room: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.chatService.getMessages(room);
  }

  @Post()
  async saveMessage(
    @Body() dto: CreateMessageDto,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.chatService.saveMessage(dto.content, parseInt(userId, 10), dto.room);
  }
}
