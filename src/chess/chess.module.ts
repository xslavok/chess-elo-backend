import { Module } from '@nestjs/common';
import { ChessService } from './chess.service';
import { ChessController } from './chess.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChessController],
  providers: [ChessService, PrismaService],
  exports: [ChessService] // <-- OVO JE ISPRAVKA! Izvozimo Servis, a ne Modul.
})
export class ChessModule {}