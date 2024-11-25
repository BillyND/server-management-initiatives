export const PERMISSIONS = {
  PROFILE: {
    UPDATE: 'profile.update',
  },
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    READ_ALL: 'users.read_all',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    MANAGE: 'users.manage',
  },
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
    MANAGE: 'roles.manage',
  },
  PERMISSIONS: {
    CREATE: 'permissions.create',
    READ: 'permissions.read',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
  },
  INITIATIVES: {
    CREATE: 'initiatives.create',
    READ: 'initiatives.read',
    UPDATE: 'initiatives.update',
    DELETE: 'initiatives.delete',
    APPROVE: 'initiatives.approve',
    REJECT: 'initiatives.reject',
  },
} as const;

export type PermissionType = typeof PERMISSIONS;
