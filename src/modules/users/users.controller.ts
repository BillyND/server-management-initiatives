import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Put,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.usersService.findByEmail(req.user.email);
      // Remove password
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error: any) {
      throw new NotFoundException('User not found', error);
    }
  }

  // Create user
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Remove password
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Put(':email/roles')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('users.manage')
  async assignRoles(
    @Param('email') email: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRolesToUser(email, assignRolesDto.roles);
  }

  @Get(':email/permissions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('users.read')
  async getUserPermissions(@Param('email') email: string) {
    return this.usersService.getUserPermissions(email);
  }
}
