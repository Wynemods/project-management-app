import { Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['error', 'info', 'query', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

let prisma: PrismaClient;
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'info', 'query', 'warn'],
    });
  }
  return prisma;
};