import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChessService } from './chess.service';

@Controller('api/chess')
export class ChessController {
  constructor(private readonly chessService: ChessService) {}

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
}