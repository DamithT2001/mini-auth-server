import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 12;

/** Centralises bcrypt password hashing and comparison. */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return hash(plain, BCRYPT_SALT_ROUNDS);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
