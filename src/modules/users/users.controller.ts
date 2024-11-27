import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { User } from './schemas/user.schema';
import { UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create user
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Remove password
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Get(':email/permissions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async getUserPermissions(@Param('email') email: string) {
    return this.usersService.getUserPermissions(email);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.USERS.READ_ALL)
  async findAll(@Request() req) {
    return await this.usersService.findAll(req, req.user.email);
  }

  @Get(':email')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.USERS.READ)
  async findOne(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    // Remove password
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateProfile(
        req.user.email,
        updateProfileDto,
      );

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error: any) {
      throw new NotFoundException('User not found', error.message);
    }
  }

  @Put(':email')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.USERS.UPDATE)
  async updateUser(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateProfileDto,
  ) {
    await this.userModel.updateOne({ email }, updateUserDto);
    return this.usersService.findByEmail(email);
  }

  @Put(':email/roles')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(PERMISSIONS.USERS.MANAGE)
  async assignRoles(
    @Param('email') email: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRolesToUser(email, assignRolesDto.roleIds);
  }
}
