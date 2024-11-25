import { Injectable, OnModuleInit } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PERMISSIONS } from './permissions.constants';

@Injectable()
export class PermissionsSeeder implements OnModuleInit {
  constructor(private readonly permissionsService: PermissionsService) {}

  async onModuleInit() {
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

    try {
      // Add try-catch to handle errors
      await this.permissionsService.seedDefaultPermissions(defaultPermissions);
    } catch (error) {
      console.error('Error seeding permissions:', error);
      // Can throw error or handle according to your logic
    }
  }
}
