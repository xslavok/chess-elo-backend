import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { ChessController } from './chess/chess.controller';
import { ChessService } from './chess/chess.service';

@Module({
  imports: [],
  // Svi kontroleri (rute) koje tvoj backend sluša:
  controllers: [
    AuthController,  // Sluša /auth/register i /auth/login (FIDE Magija + Bcrypt)
    ChessController, // Sluša /api/chess/save i /api/chess/history/:userId (PGN + Istorija)
  ],
  // Svi servisi i provajderi koji komuniciraju sa bazom i izvršavaju logiku:
  providers: [
    PrismaService, // Komunikacija sa SQLite bazom
    ChessService,  // Logika za čuvanje i čitanje šahovskih kartona
  ],
})
export class AppModule {}