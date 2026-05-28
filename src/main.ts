import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // OVO DOZVOLJAVA FRONTENDU DA ŠALJE PODATKE
  app.enableCors(); 
  await app.listen(3000);
}
bootstrap();