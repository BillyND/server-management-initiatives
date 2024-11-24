import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { DEFAULT_ROLE } from '../roles/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const validatedUser = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!validatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(validatedUser.email);
    await this.usersService.updateRefreshToken(validatedUser.email, {
      refreshToken: tokens.refreshToken,
    });

    return {
      ...tokens,
      user: {
        ...validatedUser,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      const defaultRole = await this.rolesService.findByName(DEFAULT_ROLE);
      await this.usersService.assignRolesToUser(user.email, [defaultRole]);

      const tokens = await this.getTokens(user.email);
      await this.usersService.updateRefreshToken(user.email, {
        refreshToken: tokens.refreshToken,
      });

      return {
        ...tokens,
        user: {
          email: user.email,
          name: user.name,
          roles: [defaultRole],
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(email: string) {
    await this.usersService.updateRefreshToken(email, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(email: string, refreshToken: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = user.refreshToken === refreshToken;
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.getTokens(user.email);
    await this.usersService.updateRefreshToken(user.email, {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  private async getTokens(email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { email },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        { email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyToken(token: string) {
    const decodedToken = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const user = await this.usersService.findByEmail(decodedToken.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
