import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChessService {
  constructor(private prisma: PrismaService) {}

  async sacuvajTurnir(data: any) {
    return this.prisma.tournament.create({
      data: {
        name: data.name,
        userId: data.userId,
        pgn: data.pgn,
        matches: {
          create: data.matches.map((m: any) => ({
            opponentElo: m.opponentElo,
            opponentTitle: m.opponentTitle, // <--- Upisujemo titulu u bazu
            result: m.result,
            ratingChange: m.ratingChange,
          })),
        },
      },
    });
  }

  async dobaviIstoriju(userId: string) {
    return this.prisma.tournament.findMany({
      where: { userId },
      include: { matches: true },
      orderBy: { date: 'desc' },
    });
  }

  async obrisiTurnir(id: string) {
    await this.prisma.match.deleteMany({ where: { tournamentId: id } });
    return this.prisma.tournament.delete({ where: { id } });
  }
}