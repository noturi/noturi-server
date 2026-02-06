import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthAdminController } from './admin/auth.admin.controller';
import { AdminAuthService } from './admin/auth.admin.service';
import { AuthClientController } from './client/auth.client.controller';
import { ClientAuthService } from './client/auth.client.service';
import { OAuthService } from './client/oauth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getEnvConfig } from '../../common/config/env.config';
import { CategoriesModule } from '../categories/categories.module';

const envConfig = getEnvConfig();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
      signOptions: { expiresIn: envConfig.JWT_EXPIRES_IN },
    }),
    CategoriesModule,
  ],
  controllers: [AuthAdminController, AuthClientController],
  providers: [AdminAuthService, ClientAuthService, OAuthService, TokenService, JwtStrategy],
  exports: [AdminAuthService, ClientAuthService, TokenService, JwtStrategy],
})
export class AuthModule {}
