import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

/** Generates cryptographically secure random values. */
@Injectable()
export class CryptoService {
  /** Returns a hex-encoded random token of the given byte length (default 32 bytes = 64 hex chars). */
  generateToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }
}
