import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Ubacujemo bazu
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class FideService {
  private readonly logger = new Logger(FideService.name);

  // Povezujemo PrismaService da bismo mogli da pretražujemo lokalnu bazu
  constructor(private prisma: PrismaService) {}

  async getPlayerProfile(fideId: string) {
    if (!fideId) return null;

    this.logger.log(`Pokrećem očitavanje za FIDE ID: ${fideId}`);

    try {
      // 1. KORAK: BRZA LOKALNA PROVERA (Balkan lista koju smo učitali)
      const localPlayer = await this.prisma.fidePlayer.findUnique({
        where: { fideId: fideId }
      });

      if (localPlayer) {
        this.logger.log(`✅ Igrač pronađen u LOKALNOJ bazi: ${localPlayer.name} (${localPlayer.fed})`);
        return {
          name: localPlayer.name,
          title: localPlayer.title,
          rating: localPlayer.rating
        };
      }

      // 2. KORAK: OSTATAK SVETA (Scraper ide na web ako ga nema u lokalnoj bazi)
      this.logger.log(`Igrač nije u lokalnoj bazi. Pokrećem FIDE Scraper na webu...`);
      
      const response = await axios.get(`https://ratings.fide.com/profile/${fideId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });

      this.logger.log(`FIDE sajt odgovorio sa statusom: ${response.status}`);
      const $ = cheerio.load(response.data);

      const rawName = $('.profile-top-title').text().trim();
      const standardRatingStr = $('.profile-top-rating-data').eq(0).text().replace(/\D/g, '');
      const standardRating = parseInt(standardRatingStr) || 1500;

      if (!rawName) {
         this.logger.warn(`UPOZORENJE: Nisam našao ime na FIDE sajtu.`);
         return null;
      }

      const titles = ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];
      let title = null;
      let cleanName = rawName;

      for (const t of titles) {
        if (rawName.startsWith(t + ' ')) {
          title = t;
          cleanName = rawName.replace(t, '').trim();
          break;
        }
      }

      this.logger.log(`Uspešno izvučeno sa weba: ${cleanName}, Titula: ${title}, Rejting: ${standardRating}`);

      return {
        name: cleanName || null,
        title: title,
        rating: standardRating
      };

    } catch (error: any) {
      if (error.response) {
         this.logger.error(`FIDE API GREŠKA: Status ${error.response.status} - ${error.message}`);
      } else if (error.request) {
         this.logger.error(`FIDE API GREŠKA: Nema odgovora od servera (Timeout?)`);
      } else {
         this.logger.error(`FIDE API GREŠKA: Sistemska greška - ${error.message}`);
      }
      return null;
    }
  }
}