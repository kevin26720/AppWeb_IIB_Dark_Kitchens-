import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('available') available?: string,
  ) {
    return this.productsService.findAll({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      category,
      q,
      available,
    });
  }

  @Get('categories/list')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(
    @Headers('x-user-role') role: string,
    @Body() dto: CreateProductDto,
  ) {
    if (!role) throw new UnauthorizedException('Authentication required');
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create products');
    }
    return this.productsService.create(dto);
  }

  @Put(':id')
  update(
    @Headers('x-user-role') role: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    if (!role) throw new UnauthorizedException('Authentication required');
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update products');
    }
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('x-user-role') role: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!role) throw new UnauthorizedException('Authentication required');
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete products');
    }
    return this.productsService.remove(id);
  }
}
