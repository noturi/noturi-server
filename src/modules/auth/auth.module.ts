import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthAdminController } from './admin/auth.admin.controller';
import { AdminAuthService } from './admin/auth.admin.service';
import { AuthClientController } from './client/auth.client.controller';
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
  controllers: [AuthAdminController, AuthClientController],
  providers: [AdminAuthService, ClientAuthService, JwtStrategy],
  exports: [AdminAuthService, ClientAuthService, JwtStrategy],
})
export class AuthModule {}
