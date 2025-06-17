import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/config/prisma.config';
import { CloudinaryProvider } from 'services/cloudinary/cloudinary.config';
import { CloudinaryService } from 'services/cloudinary/cloudinary.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService, CloudinaryProvider],
  exports: [UsersService],
})
export class UsersModule {}
