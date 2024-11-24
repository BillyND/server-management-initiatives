import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Authenticates a user and generates tokens
   * @param email - User's email
   * @param password - User's password
   * @returns Object containing access token and refresh token
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService
      .findByEmail(loginDto.email)
      .catch(() => null);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const tokens = await this.generateTokens(user.email);

    // Hash and store refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user.email, {
      refreshToken: hashedRefreshToken,
    });

    // Remove password and refreshToken from response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Generates access and refresh tokens for a user
   * @param userId - The user's ID
   * @param email - The user's email
   * @returns Object containing access token and refresh token
   */
  async generateTokens(email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '1d',
        },
      ),
      this.jwtService.signAsync(
        { email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes access and refresh tokens
   * @param userId - User's ID
   * @param refreshToken - Current refresh token
   * @returns Object containing new access token and refresh token
   * @throws UnauthorizedException if refresh token is invalid
   */
  async refreshTokens(email: string, refreshToken: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user.email);

    // Update with new refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user.email, {
      refreshToken: hashedRefreshToken,
    });

    return tokens;
  }

  /**
   * Logs out a user by removing their refresh token
   * @param userId - User's ID
   * @returns true if logout successful
   */
  async logout(token: string): Promise<void> {
    try {
      // Verify token
      const decoded = await this.verifyToken(token);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      // Find user and delete refresh token
      const user = await this.usersService.findByEmail(decoded.email);
      await this.usersService.updateRefreshToken(user.email, null);
    } catch (error) {
      throw new UnauthorizedException('Logout failed', error);
    }
  }

  async verifyToken(token: string): Promise<any> {
    return await this.jwtService.verifyAsync(token).catch(() => {});
  }

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Verify token and get user email
    const verifyData = await this.verifyToken(token);
    if (!verifyData?.email) {
      throw new UnauthorizedException('Invalid token');
    }

    // Get user from database
    const user = await this.usersService.findByEmail(verifyData.email);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new UnauthorizedException(
        'New password must be different from current password',
      );
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.email, {
      password: hashedPassword,
    });
  }
}
