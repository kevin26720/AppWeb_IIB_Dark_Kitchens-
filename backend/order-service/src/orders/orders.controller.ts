import { Controller, Get, Post, Body, Param, Headers, ForbiddenException, Put, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private extractUserId(header: string | undefined): number {
    if (!header) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }
    const userId = parseInt(header, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid X-User-Id header');
    }
    return userId;
  }

  @Post()
  create(
    @Headers('x-user-id') userIdHeader: string,
    @Body() createOrderDto: CreateOrderDto
  ) {
    const userId = this.extractUserId(userIdHeader);
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get('my-orders')
  findMyOrders(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.extractUserId(userIdHeader);
    return this.ordersService.findMyOrders(userId);
  }

  @Get()
  findAll(@Headers('x-user-role') roleHeader: string) {
    if (roleHeader !== 'ADMIN') {
      throw new ForbiddenException('Only admins can access all orders');
    }
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') roleHeader: string,
    @Body('status') status: OrderStatus
  ) {
    if (roleHeader !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update order status');
    }
    return this.ordersService.updateStatus(id, status);
  }
}
