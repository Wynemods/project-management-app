import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/config/prisma.config';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CloudinaryProvider } from 'src/config/cloudinary.config';

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
