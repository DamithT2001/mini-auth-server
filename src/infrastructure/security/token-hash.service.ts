import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/** Produces deterministic SHA-256 hashes for opaque token storage. */
@Injectable()
export class TokenHashService {
  sha256(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
