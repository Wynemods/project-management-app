import { PrismaClient } from 'generated/prisma';

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'info', 'query', 'warn'],
    });
  }
  return prisma;
};