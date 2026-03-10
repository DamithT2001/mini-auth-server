import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { LoginAuditService } from './services/login-audit.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { JwtService } from '../../infrastructure/security/jwt.service';
import { PasswordService } from '../../infrastructure/security/password.service';
import { TokenHashService } from '../../infrastructure/security/token-hash.service';
import { CryptoService } from '../../infrastructure/security/crypto.service';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    EmailVerificationService,
    LoginAuditService,
    RefreshTokenService,
    PasswordService,
    TokenHashService,
    CryptoService,
  ],
  exports: [JwtService],
})
export class AuthModule {}
