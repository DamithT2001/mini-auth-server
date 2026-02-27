import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestMetadata } from './decorators/request-metadata.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @RequestMetadata()
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    return this.authService.login(dto, meta.ipAddress, meta.userAgent);
  }
}
