import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/permissions.enum';
import { ERROR_MESSAGES } from '../constants/error-messages';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_REQUIRED);
    }

    return true;
  }
}
