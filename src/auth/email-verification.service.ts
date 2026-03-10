import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_EXPIRY_MINUTES = 15;

@Injectable()
export class EmailVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

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

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000),
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
    const tokenHash = this.hashToken(rawToken);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification token');
    }

    if (new Date() > record.expiresAt) {
      await this.prisma.emailVerificationToken.delete({
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
      this.prisma.emailVerificationToken.delete({
        where: { id: record.id },
      }),
    ]);
  }
}
