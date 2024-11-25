import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PermissionsService } from './modules/permissions/permissions.service';
import { RolesService } from './modules/roles/roles.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('seed')
  async seed() {
    await this.permissionsService.seedDefaultPermissions();
    await this.rolesService.seedDefaultRoles();
  }
}
