import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService implements OnModuleInit {
  private privateKey!: string;
  private publicKey!: string;
  private issuer!: string;
  private audience!: string;
  private accessExpiresIn!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const privateKeyPath = this.configService.getOrThrow<string>(
      'JWT_PRIVATE_KEY_PATH',
    );
    const publicKeyPath = this.configService.getOrThrow<string>(
      'JWT_PUBLIC_KEY_PATH',
    );

    const resolvedPrivate = resolve(privateKeyPath);
    const resolvedPublic = resolve(publicKeyPath);

    if (!existsSync(resolvedPrivate)) {
      throw new Error(`JWT private key not found at path: ${resolvedPrivate}`);
    }

    if (!existsSync(resolvedPublic)) {
      throw new Error(`JWT public key not found at path: ${resolvedPublic}`);
    }

    this.privateKey = readFileSync(resolvedPrivate, 'utf8');
    this.publicKey = readFileSync(resolvedPublic, 'utf8');

    this.issuer = this.configService.getOrThrow<string>('JWT_ISSUER');
    this.audience = this.configService.getOrThrow<string>('JWT_AUDIENCE');
    this.accessExpiresIn = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    );
  }

  /**
   * Signs a short-lived JWT access token using the RS256 private key.
   */
  signAccessToken(payload: {
    sub: string;
    email: string;
    roles: string[];
  }): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: this.accessExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verifies a JWT access token against the RS256 public key, issuer, and audience.
   * Throws if the token is invalid, expired, or has an unexpected issuer/audience.
   */
  verifyAccessToken<T = unknown>(token: string): T {
    return jwt.verify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
    }) as T;
  }
}
