import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  // PrismaService se comparte en este servicio para evitar conexiones duplicadas.
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
