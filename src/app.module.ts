import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChessModule } from './chess/chess.module';

@Module({
  imports: [AuthModule, ChessModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}