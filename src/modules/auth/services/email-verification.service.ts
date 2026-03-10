import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TokenHashService } from '../../../infrastructure/security/token-hash.service';
import { CryptoService } from '../../../infrastructure/security/crypto.service';

const TOKEN_EXPIRY_MINUTES = 15;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenHashService: TokenHashService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Generates a secure random token, stores its SHA-256 hash, and invalidates any prior token.
   * The raw token is returned once and must be delivered to the user immediately.
   */
  async generate(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const rawToken = this.cryptoService.generateToken();
    const tokenHash = this.tokenHashService.sha256(rawToken);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60_000),
        },
      }),
    ]);

    return rawToken;
  }

  /**
   * Validates the raw token against its stored hash, enforces expiry, and marks the user's
   * email as verified. Cleans up the token record atomically with the verification update.
   */
  async verify(rawToken: string): Promise<void> {
    const tokenHash = this.tokenHashService.sha256(rawToken);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification token');
    }

    if (new Date() > record.expiresAt) {
      await this.prisma.emailVerificationToken.deleteMany({
        where: { id: record.id },
      });
      throw new BadRequestException('Verification token expired');
    }

    if (record.user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.deleteMany({
        where: { id: record.id },
      }),
    ]);
  }
}
