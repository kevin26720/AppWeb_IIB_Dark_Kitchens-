import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    limit?: number;
    offset?: number;
    category?: string;
    q?: string;
    available?: string;
  }) {
    const { limit = 10, offset = 0, category, q, available } = params;

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Convert Decimal to number for JSON serialization
    const serializedData = data.map((p) => ({
      ...p,
      price: Number(p.price),
    }));

    return { data: serializedData, total, limit, offset };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return { ...product, price: Number(product.price) };
  }

  async getCategories(): Promise<string[]> {
    const result = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category);
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto });
    return { ...product, price: Number(product.price) };
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id); // throws if not found
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
    });
    return { ...product, price: Number(product.price) };
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found
    await this.prisma.product.delete({ where: { id } });
    return { message: `Product #${id} deleted` };
  }
}
