import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ description: 'Login successful, returns access token' })
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
}
