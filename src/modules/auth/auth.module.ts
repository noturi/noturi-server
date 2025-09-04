import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthAdminController } from './admin/auth.admin.controller';
import { AdminManagementController } from './admin/admin-management.controller';
import { AdminAuthService } from './admin/auth.admin.service';
import { AdminManagementService } from './admin/admin-management.service';
import { AuthClientController, AuthController } from './client/auth.client.controller';
import { ClientAuthService } from './client/auth.client.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getEnvConfig } from '../../common/config/env.config';

const envConfig = getEnvConfig();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
      signOptions: { expiresIn: envConfig.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthAdminController, AdminManagementController, AuthClientController, AuthController],
  providers: [AdminAuthService, AdminManagementService, ClientAuthService, JwtStrategy],
  exports: [AdminAuthService, AdminManagementService, ClientAuthService, JwtStrategy],
})
export class AuthModule {}
