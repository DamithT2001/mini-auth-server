import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { AuthorizationCodeService } from './services/authorization-code.service';
import { PkceService } from './services/pkce.service';
import { TokenService } from './services/token.service';

@Module({
  controllers: [OAuthController],
  providers: [
    OAuthService,
    AuthorizationCodeService,
    PkceService,
    TokenService,
  ],
})
export class OAuthModule {}
