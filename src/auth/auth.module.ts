import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { TokenCleanupService } from './token-cleanup.service';
import { JwtService } from '../infrastructure/security/jwt.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    EmailVerificationService,
    TokenCleanupService,
  ],
  exports: [JwtService],
})
export class AuthModule {}
