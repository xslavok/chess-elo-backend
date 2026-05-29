// backend/import-fide.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

const prisma = new PrismaClient();

const BALKAN_FEDS = ['SRB', 'BIH', 'CRO', 'MKD', 'MNE'];

async function main() {
  const filePath = path.join(__dirname, 'fide-data', 'lista.txt');

  if (!fs.existsSync(filePath)) {
    console.error('❌ Fajl lista.txt nije pronađen u folderu fide-data!');
    process.exit(1);
  }

  console.log('⏳ Pokrećem čitanje FIDE liste. Ovo može potrajati minut-dva...');

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let ucitanoIgraca = 0;
  let balkanIgraca = 0;
  let isFirstLine = true;

  for await (const line of rl) {
    // Preskačemo prvi red (zaglavlje)
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    ucitanoIgraca++;

    // FIDE txt fajl koristi fiksne pozicije karaktera. Zato sečemo red po kolonama.
    const fideId = line.substring(0, 15).trim();
    const name = line.substring(15, 76).trim();
    const fed = line.substring(76, 79).trim();
    const title = line.substring(84, 87).trim() || null;
    const ratingStr = line.substring(113, 117).trim();

    // Zadržavamo samo igrače iz odabranih federacija
    if (BALKAN_FEDS.includes(fed)) {
      balkanIgraca++;
      const rating = parseInt(ratingStr) || 1500;

      // Upsert: Ako igrač ne postoji, napravi ga. Ako postoji, ažuriraj mu rejting i titulu.
      await prisma.fidePlayer.upsert({
        where: { fideId: fideId },
        update: {
          rating: rating,
          title: title,
        },
        create: {
          fideId: fideId,
          name: name,
          fed: fed,
          rating: rating,
          title: title,
        },
      });

      // Ispisujemo svakog 1000-tog da vidimo da radi
      if (balkanIgraca % 1000 === 0) {
        console.log(`✅ Ubačeno/ažurirano ${balkanIgraca} igrača sa Balkana...`);
      }
    }
  }

  console.log('🎉 GOTOVO!');
  console.log(`📊 Ukupno pročitano linija: ${ucitanoIgraca}`);
  console.log(`🇷🇸🇧🇦🇭🇷🇲🇪🇲🇰 Ukupno sačuvano naših igrača: ${balkanIgraca}`);
}

main()
  .catch((e) => {
    console.error('❌ Greška prilikom učitavanja:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });