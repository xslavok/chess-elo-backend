import { Controller, Post, Body, Get, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ChessService } from './chess.service';
import { PrismaService } from '../prisma.service';

@Controller('api/chess')
export class ChessController {
  constructor(
    private readonly chessService: ChessService,
    private prisma: PrismaService 
  ) {}

  // Ova ruta SLUŠA kada frontend pošalje nove rezultate turnira
  @Post('save')
  async sacuvajTurnir(@Body() podaci: any) {
    return this.chessService.sacuvajTurnir(podaci);
  }

  // Ova ruta VRAĆA istoriju turnira za određenog korisnika
  @Get('history/:userId')
  async dobaviIstoriju(@Param('userId') userId: string) {
    return this.chessService.dobaviIstoriju(userId);
  }

  // 🚨 RUTA ZA BRISANJE (Prilagođena tvojoj Prisma šemi)
  @Delete(':id')
  async obrisiPartiju(@Param('id') id: string) {
    try {
      // 1. Prvo brišemo sve mečeve koji pripadaju ovom turniru
      await this.prisma.match.deleteMany({
        where: { tournamentId: id }
      });

      // 2. Zatim brišemo sam turnir
      await this.prisma.tournament.delete({
        where: { id: id }
      });

      return { success: true, message: 'Zapis uspešno obrisan!' };
    } catch (error) {
      throw new HttpException('Greška pri brisanju zapisa iz baze', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}