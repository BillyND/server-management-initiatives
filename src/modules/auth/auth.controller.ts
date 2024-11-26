import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  async verifyToken(@Request() req) {
    const accessToken = req.get('Authorization').replace('Bearer', '').trim();
    return await this.authService.verifyToken(accessToken);
  }

  @Post('refresh-token')
  async refreshToken(
    @Request() req,
    @Body() refreshTokenDto: { refreshToken: string },
  ) {
    return this.authService.refreshTokens(
      req.user.email,
      refreshTokenDto.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(
      req.user.email,
      changePasswordDto,
    );
  }
}
