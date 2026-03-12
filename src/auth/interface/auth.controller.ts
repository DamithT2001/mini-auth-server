import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { AuthService } from '../application/auth.service';
import { EmailVerificationService } from '../application/email-verification.service';
import { RequestMetadata } from './decorators/request-metadata.decorator';
import { LoginDto } from '../application/dto/login.dto';
import { RegisterDto } from '../application/dto/register.dto';
import { VerifyEmailDto } from '../application/dto/verify-email.dto';
import { ResendVerificationDto } from '../application/dto/resend-verification.dto';

/**
 * Exposes authentication endpoints for registration, login, and email verification.
 * All routes are rate-limited to mitigate brute-force and abuse.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or client' })
  @ApiForbiddenResponse({ description: 'Email address is not verified' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @RequestMetadata()
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    return this.authService.login(dto, meta.ipAddress, meta.userAgent);
  }

  @Post('verify-email/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @ApiOperation({ summary: 'Confirm email verification (API)' })
  @ApiOkResponse({ description: 'Email successfully verified' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async confirmVerification(@Body() dto: VerifyEmailDto) {
    await this.emailVerificationService.verify(dto.token);
    return { message: 'Email successfully verified' };
  }

  @Get('verify-email/confirm')
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @ApiOperation({ summary: 'Confirm email verification (browser link)' })
  @ApiOkResponse({ description: 'Email successfully verified' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async confirmVerificationGet(@Query() dto: VerifyEmailDto) {
    await this.emailVerificationService.verify(dto.token);
    return { message: 'Email successfully verified' };
  }

  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: minutes(1), limit: 5 } })
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiOkResponse({
    description: 'Verification email sent if account exists and is unverified',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto);
    return {
      message:
        'If your account exists and is unverified, a new verification email has been sent',
    };
  }
}
