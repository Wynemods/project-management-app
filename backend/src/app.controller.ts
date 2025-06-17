import { Controller, Get } from '@nestjs/common';
import { getPrismaClient } from './config/prisma.config';

@Controller()
export class AppController {
  private prisma = getPrismaClient()
  @Get('health')
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch (error) {
      return { status: 'error', db: 'disconnected', error: error.message };
    }
  }
}
