import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  // UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';
import { PERMISSIONS } from './permissions.constants';

@Controller('permissions')
// @UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PERMISSIONS.CREATE)
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS.READ)
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PERMISSIONS.READ)
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PERMISSIONS.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PERMISSIONS.DELETE)
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Post('seed')
  seedDefaultPermissions() {
    const defaultPermissions = [
      { name: PERMISSIONS.USERS.CREATE, description: 'Create users' },
      { name: PERMISSIONS.USERS.READ, description: 'Read users' },
      { name: PERMISSIONS.USERS.UPDATE, description: 'Update users' },
      { name: PERMISSIONS.USERS.DELETE, description: 'Delete users' },
      { name: PERMISSIONS.ROLES.CREATE, description: 'Create roles' },
      { name: PERMISSIONS.ROLES.READ, description: 'Read roles' },
      { name: PERMISSIONS.ROLES.UPDATE, description: 'Update roles' },
      { name: PERMISSIONS.ROLES.DELETE, description: 'Delete roles' },
      {
        name: PERMISSIONS.ROLES.MANAGE,
        description: 'Manage role permissions',
      },
      {
        name: PERMISSIONS.PERMISSIONS.CREATE,
        description: 'Create permissions',
      },
      { name: PERMISSIONS.PERMISSIONS.READ, description: 'Read permissions' },
      {
        name: PERMISSIONS.PERMISSIONS.UPDATE,
        description: 'Update permissions',
      },
      {
        name: PERMISSIONS.PERMISSIONS.DELETE,
        description: 'Delete permissions',
      },
      {
        name: PERMISSIONS.INITIATIVES.CREATE,
        description: 'Create initiatives',
      },
      { name: PERMISSIONS.INITIATIVES.READ, description: 'Read initiatives' },
      {
        name: PERMISSIONS.INITIATIVES.UPDATE,
        description: 'Update initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.DELETE,
        description: 'Delete initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.APPROVE,
        description: 'Approve initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.REJECT,
        description: 'Reject initiatives',
      },
    ];

    return this.permissionsService.seedDefaultPermissions(defaultPermissions);
  }
}
