import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return {
      ...(await this.authService.login(loginDto)),
      success: true,
    };
  }

  @Get('verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Headers() headers: Headers) {
    // Check for authorization header
    const auth = headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    // Extract and verify token
    const token = auth.split(' ')[1];
    const verifyData = await this.authService.verifyToken(token);
    if (!verifyData) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Extract email and get user data
    const { email } = verifyData;
    if (!email) {
      throw new UnauthorizedException('Token payload missing email');
    }

    try {
      const user = await this.usersService.findByEmail(email);
      // Remove sensitive data from response
      const {
        password: _,
        refreshToken: __,
        ...userWithoutSensitiveData
      } = user;

      return {
        user: userWithoutSensitiveData,
        success: true,
      };
    } catch (error) {
      throw new UnauthorizedException('User not found', error);
    }
  }

  @Post('refresh-token')
  async refreshToken(
    @Body() refreshTokenDto: { email: string; refreshToken: string },
  ) {
    return this.authService.refreshTokens(
      refreshTokenDto.email,
      refreshTokenDto.refreshToken,
    );
  }
}
