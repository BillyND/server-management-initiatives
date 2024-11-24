import { Injectable, OnModuleInit } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';
import { ROLES } from './roles.enum';
import { RolesService } from './roles.service';
import { PERMISSIONS } from '../permissions/permissions.constants';

@Injectable()
export class RolesSeeder implements OnModuleInit {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async onModuleInit() {
    // First, fetch all permissions from the database
    const allPermissions = await this.permissionsService.findAll();

    // Create permission maps for each role
    const superAdminPerms = allPermissions.map((p: any) => p?._id);
    const adminPerms = allPermissions
      .filter((p: any) =>
        [
          PERMISSIONS.USERS.CREATE,
          PERMISSIONS.USERS.READ,
          PERMISSIONS.USERS.UPDATE,
          PERMISSIONS.USERS.DELETE,
          PERMISSIONS.ROLES.READ,
          PERMISSIONS.ROLES.CREATE,
          PERMISSIONS.ROLES.UPDATE,
        ].includes(p.name),
      )
      .map((p: any) => p?._id);

    const managerPerms = allPermissions
      .filter((p: any) =>
        [PERMISSIONS.USERS.READ, PERMISSIONS.USERS.UPDATE].includes(p.name),
      )
      .map((p: any) => p?._id);

    const userPerms = allPermissions
      .filter((p: any) =>
        [
          PERMISSIONS.USERS.READ,
          PERMISSIONS.PROFILE.UPDATE,
          PERMISSIONS.INITIATIVES.READ,
          PERMISSIONS.INITIATIVES.CREATE,
        ].includes(p.name),
      )
      .map((p: any) => p?._id);

    const defaultRoles = [
      {
        name: ROLES.SUPER_ADMIN,
        description: 'Super Administrator with full access',
        permissions: superAdminPerms,
      },
      {
        name: ROLES.ADMIN,
        description: 'Administrator with management access',
        permissions: adminPerms,
      },
      {
        name: ROLES.MANAGER,
        description: 'Manager with department management access',
        permissions: managerPerms,
      },
      {
        name: ROLES.USER,
        description: 'Regular user with basic access',
        permissions: userPerms,
      },
    ];

    await this.rolesService.seedDefaultRoles(defaultRoles);
  }
}
