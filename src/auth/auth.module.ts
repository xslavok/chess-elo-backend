import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { FideService } from '../fide/fide.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, FideService],
})
export class AuthModule {}