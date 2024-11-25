import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PERMISSIONS } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
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
}
