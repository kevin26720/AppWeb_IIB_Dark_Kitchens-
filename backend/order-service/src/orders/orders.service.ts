import { Injectable, ServiceUnavailableException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class OrdersService {
  private readonly catalogServiceUrl: string;
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.catalogServiceUrl = this.configService.get<string>('CATALOG_SERVICE_URL') || 'http://localhost:4002';
    
    this.breaker = new CircuitBreaker(this.fetchProduct.bind(this), {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    });
  }

  private async fetchProduct(id: number) {
    const response = await axios.get(`${this.catalogServiceUrl}/products/${id}`);
    return response.data;
  }

  private mapOrderDecimalsToNumbers(order: any) {
    if (!order) return order;
    return {
      ...order,
      total: order.total ? Number(order.total) : order.total,
      items: order.items ? order.items.map(item => ({
        ...item,
        price: item.price ? Number(item.price) : item.price,
        subtotal: item.subtotal ? Number(item.subtotal) : item.subtotal,
      })) : order.items
    };
  }

  async create(userId: number, dto: CreateOrderDto) {
    // Check items via catalog service using circuit breaker
    for (const item of dto.items) {
      try {
        const product = await this.breaker.fire(item.productId);
        
        if (!product) {
          throw new BadRequestException(`Product with ID ${item.productId} not found.`);
        }
        
        if (product.isAvailable === false) {
           throw new BadRequestException(`Product ${product.name} is not available.`);
        }

        if (Number(product.price) !== item.price) {
           throw new BadRequestException(`Price mismatch for product ${product.name}. Expected ${product.price}, got ${item.price}`);
        }
      } catch (error) {
        if (error.name === 'CircuitBreakerOpen' || error.isCircuitBreakerError) {
          throw new ServiceUnavailableException('Catalog service is currently unavailable. Please try again later.');
        }
        if (error instanceof BadRequestException) {
          throw error;
        }
        if (error.response && error.response.status === 404) {
          throw new BadRequestException(`Product with ID ${item.productId} not found.`);
        }
        throw new InternalServerErrorException('Error verifying products with catalog service');
      }
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        total: dto.total,
        notes: dto.notes,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          }))
        }
      },
      include: {
        items: true,
      }
    });

    return this.mapOrderDecimalsToNumbers(order);
  }

  async findMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders.map(o => this.mapOrderDecimalsToNumbers(o));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrderDecimalsToNumbers(order);
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    if (status === OrderStatus.READY || status === OrderStatus.CANCELLED) {
      await this.redis.publish('order:notifications', {
        orderId: updatedOrder.id,
        userId: updatedOrder.userId,
        status: updatedOrder.status,
      });
    }

    return this.mapOrderDecimalsToNumbers(updatedOrder);
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders.map(o => this.mapOrderDecimalsToNumbers(o));
  }
}
