import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    // Remove password
    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password
    delete user.password;
    const token = this.generateToken(user);
    return { user, token };
  }

  private generateToken(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,
      roles: user.roles,
    };
    return this.jwtService.sign(payload);
  }
}
