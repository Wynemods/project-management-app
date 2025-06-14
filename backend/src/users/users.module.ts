import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtService } from './services/jwt.service';
import { JwtStrategy } from './services/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtService, JwtStrategy, JwtAuthGuard],
  exports: [UsersService, JwtService, JwtAuthGuard],
})
export class UsersModule {}
