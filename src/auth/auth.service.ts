import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async registracija(podaci: any) {
    // 1. Provera da li email već postoji
    const postojiEmail = await this.prisma.user.findUnique({ where: { email: podaci.email } });
    if (postojiEmail) {
      throw new HttpException('Email je već u upotrebi.', HttpStatus.BAD_REQUEST);
    }

    // Default vrednosti za amatere (bez FIDE ID-a)
    let ime = podaci.name || 'Nepoznati Igrač';
    let rejting = 1500;
    let titula = null;
    let kFaktor = 20;
    let fideId = `GUEST-${Date.now()}`; // Generišemo lažni ID ako ga nema

    // 2. FIDE VERIFIKACIJA (Ako je igrač uneo FIDE ID)
    if (podaci.fideId) {
      const postojiFide = await this.prisma.user.findUnique({ where: { fideId: podaci.fideId } });
      if (postojiFide) {
        throw new HttpException('Ovaj FIDE ID je već vezan za drugi nalog.', HttpStatus.BAD_REQUEST);
      }
      
      fideId = podaci.fideId;
      /* Mesto za pravi FIDE API fetch. 
         Pošto zvanični API ne postoji, ovde ćemo za sada simulirati 
         da je svaki registrovani FIDE igrač zapravo FIDE Majstor (FM).
      */
      ime = podaci.name || 'FIDE Takmičar'; 
      rejting = 2350;
      titula = 'FM';
      kFaktor = 20;
    }

    // 3. Upis igrača u bazu
    const noviIgrac = await this.prisma.user.create({
      data: {
        email: podaci.email,
        password: podaci.password, // U produkciji se ovo kriptuje (bcrypt)
        fideId: fideId, 
        name: ime,
        rating: rejting,
        title: titula,
        kFactor: kFaktor
      }
    });

    return noviIgrac;
  }

  async prijava(podaci: any) {
    // Provera kredencijala
    const igrac = await this.prisma.user.findUnique({ where: { email: podaci.email } });
    if (!igrac || igrac.password !== podaci.password) {
      throw new HttpException('Pogrešan email ili lozinka.', HttpStatus.UNAUTHORIZED);
    }
    return igrac;
  }
}