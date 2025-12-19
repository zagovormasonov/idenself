import { Controller, Request, Post, UseGuards, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new BadRequestException('Неверный email или пароль');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    // Basic validation
    if (!body.email || !body.password) {
       throw new BadRequestException('Email и пароль обязательны');
    }
    return this.authService.register(body);
  }
}


