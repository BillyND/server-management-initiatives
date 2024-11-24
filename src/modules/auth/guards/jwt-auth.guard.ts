import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to add custom logic if needed
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Call parent canActivate first
    const result = await super.canActivate(context);

    if (result) {
      // Get request from context
      const request = context.switchToHttp().getRequest();

      // Validate that user exists in request
      if (!request.user) {
        return false;
      }

      // Validate that token hasn't expired
      const tokenExpiration = request.user.exp * 1000; // Convert to milliseconds
      if (Date.now() >= tokenExpiration) {
        return false;
      }

      return true;
    }

    return false;
  }
}
