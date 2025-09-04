import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('인증이 필요합니다');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }

    return true;
  }
}


