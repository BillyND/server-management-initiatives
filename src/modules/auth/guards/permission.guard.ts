import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // If no permissions required, allow access
    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get user with roles and permissions
    const userWithRoles = await this.usersService.findByEmailWithRoles(
      user.email,
    );

    if (!userWithRoles) {
      throw new UnauthorizedException('User not found');
    }

    // Extract unique permissions from all user roles
    const userPermissions = new Set(
      userWithRoles.roles
        ?.filter(Boolean)
        ?.flatMap((role) =>
          role?.permissions
            ?.filter(Boolean)
            ?.map((permission) => permission?.name),
        ) || [],
    );

    // Check if user has any of the required permissions
    return requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );
  }
}
