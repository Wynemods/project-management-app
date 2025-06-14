import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}