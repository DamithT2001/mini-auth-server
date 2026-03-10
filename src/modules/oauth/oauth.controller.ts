import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/** OAuth 2.0 authorization and token endpoints (RFC 6749). */
@ApiTags('oauth')
@Controller('oauth')
export class OAuthController {}
