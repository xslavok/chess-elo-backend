import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class FideService {
  private readonly logger = new Logger(FideService.name);

  async getPlayerProfile(fideId: string) {
    if (!fideId) return null;

    this.logger.log(`Pokrećem očitavanje za FIDE ID: ${fideId}`);

    try {
      const response = await axios.get(`https://ratings.fide.com/profile/${fideId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000 // Ne čekaj zauvek
      });

      this.logger.log(`FIDE sajt odgovorio sa statusom: ${response.status}`);
      
      const $ = cheerio.load(response.data);

      // Logujemo sirovi HTML da vidimo šta smo tačno dobili
      const rawName = $('.profile-top-title').text().trim();
      this.logger.log(`Sirovo pročitano ime (rawName): "${rawName}"`);
      
      const standardRatingStr = $('.profile-top-rating-data').eq(0).text().replace(/\D/g, '');
      this.logger.log(`Sirov pročitani rejting: "${standardRatingStr}"`);

      const standardRating = parseInt(standardRatingStr) || 1500;

      if (!rawName) {
         this.logger.warn(`UPOZORENJE: Nisam našao ime u .profile-top-title. Možda je FIDE promenio dizajn sajta?`);
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

      this.logger.log(`Uspešno izvučeno: ${cleanName}, Titula: ${title}, Rejting: ${standardRating}`);

      return {
        name: cleanName || null,
        title: title,
        rating: standardRating
      };
    } catch (error: any) {
      if (error.response) {
         // Server je odgovorio, ali sa greškom (npr. 403, 404)
         this.logger.error(`FIDE API GREŠKA: Status ${error.response.status} - ${error.message}`);
      } else if (error.request) {
         // Zahtev poslat, ali nema odgovora
         this.logger.error(`FIDE API GREŠKA: Nema odgovora od servera (Timeout?)`);
      } else {
         this.logger.error(`FIDE API GREŠKA: Sistemska greška - ${error.message}`);
      }
      return null;
    }
  }
}