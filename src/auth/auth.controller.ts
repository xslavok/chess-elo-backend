import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Controller('api/auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: any) {
    const { email, password, fideId } = body;

    // 1. Provera postojećih korisnika
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { fideId }] }
    });
    
    if (existingUser) {
      throw new HttpException('Korisnik sa ovim emailom ili FIDE ID-em već postoji!', HttpStatus.BAD_REQUEST);
    }

    // 2. FIDE MAGIJA (Web Scraping sa TIMEOUT ZAŠTITOM)
    let name = 'Nepoznat Igrač';
    let rating = 1500;
    let title = null;

    try {
      // 5000ms Timeout sprečava smrzavanje servera ako FIDE API padne
      const { data } = await axios.get(`https://ratings.fide.com/profile/${fideId}`, {
        timeout: 5000 
      });
      
      const $ = cheerio.load(data);

      const scrapedName = $('.profile-top-title').text().trim();
      if (scrapedName) name = scrapedName;

      const stdRatingText = $('.profile-top-rating-data').first().text();
      const parsedRating = parseInt(stdRatingText.replace(/\D/g, ''), 10);
      if (!isNaN(parsedRating)) rating = parsedRating;

      const scrapedTitle = $('.profile-top-info__block__row__data').first().text().trim();
      if (scrapedTitle && scrapedTitle !== 'None' && scrapedTitle.length < 5) {
        title = scrapedTitle;
      }
    } catch (error) {
      console.log(`Upozorenje: API greška pri povlačenju FIDE ID-a: ${fideId}`);
    }

    // 3. Bcrypt Hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Kreiranje Korisnika
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, fideId, name, rating, title }
    });

    // BEZBEDNOST: Nikada ne šaljemo password hash klijentu
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpException('Pogrešan email!', HttpStatus.UNAUTHORIZED);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new HttpException('Pogrešna lozinka!', HttpStatus.UNAUTHORIZED);

    // BEZBEDNOST: Nikada ne šaljemo password hash klijentu
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}