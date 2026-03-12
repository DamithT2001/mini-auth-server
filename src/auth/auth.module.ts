import { Module } from '@nestjs/common';
import { AuthController } from './interface/auth.controller';
import { AuthService } from './application/auth.service';
import { EmailVerificationService } from './application/email-verification.service';
import { JwtService } from '../infrastructure/security/jwt.service';
import { MailModule } from '../infrastructure/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, EmailVerificationService],
  exports: [JwtService],
})
export class AuthModule {}
