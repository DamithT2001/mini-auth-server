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

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000),
        },
      }),
    ]);

    return rawToken;
  }

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
      throw new BadRequestException('Verification token expired');
    }

    if (record.user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { id: record.id },
    });
  }
}
