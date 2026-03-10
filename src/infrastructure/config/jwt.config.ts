import { registerAs } from '@nestjs/config';

/** Named JWT configuration block — consume via ConfigService.get('jwt'). */
export default registerAs('jwt', () => ({
  privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH ?? '',
  publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH ?? '',
  issuer: process.env.JWT_ISSUER ?? '',
  audience: process.env.JWT_AUDIENCE ?? '',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '900',
}));
