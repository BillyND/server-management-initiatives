import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Headers() headers: Headers) {
    const auth = headers['authorization'];
    const token = auth.split(' ')[1];

    try {
      await this.authService.logout(token);
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Logout failed', error);
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers() headers: Headers,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const auth = headers['authorization'];
    const token = auth.split(' ')[1];

    console.log(changePasswordDto);

    try {
      await this.authService.changePassword(
        token,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Headers() headers: Headers,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{
    user: Omit<User, 'password' | 'refreshToken'>;
    success: boolean;
    message: string;
  }> {
    const auth = headers['authorization'];
    const token = auth.split(' ')[1];

    try {
      const verifyData = await this.authService.verifyToken(token);
      const { email } = verifyData;

      const updatedUser = await this.usersService.updateProfile(email, {
        ...updateProfileDto,
      });

      // Remove sensitive data from response
      const {
        password: _,
        refreshToken: __,
        ...userWithoutSensitiveData
      } = updatedUser;

      return {
        user: userWithoutSensitiveData,
        success: true,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
