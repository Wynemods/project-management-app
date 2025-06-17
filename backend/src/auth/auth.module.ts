import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';

import { TokenService } from './services/token.service';
import { PermissionsService } from './services/permission.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permission.guard';
import { PermissionsMiddleware } from './middleware/permissions.middleware';
import { EmailModule } from 'services/mailer/email.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PermissionsService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,

  ],
  exports: [
    AuthService,
    TokenService,
    PermissionsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ]
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PermissionsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}