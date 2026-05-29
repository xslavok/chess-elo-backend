import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  // Ubacujemo AuthService u kontroler
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    // KONTROLER VIŠE NIŠTA NE RADI SAM!
    // Samo prosleđuje podatke u naš moćni AuthService i vraća odgovor na Netlify
    return this.authService.registracija(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.prijava(body);
  }
}