import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { JwtPayload } from '../types/jwt-payload.type';

/** Validates RS256 Bearer tokens and attaches the decoded payload to the request. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKeyPath = resolve(
      configService.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'),
    );

    if (!existsSync(publicKeyPath)) {
      throw new Error(`JWT public key not found at path: ${publicKeyPath}`);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: readFileSync(publicKeyPath, 'utf8'),
      algorithms: ['RS256'],
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
      audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
