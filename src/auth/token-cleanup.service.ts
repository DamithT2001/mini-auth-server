import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Deletes expired email verification tokens. Runs every hour. */
  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredVerificationTokens(): Promise<void> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    if (result.count > 0) {
      this.logger.log(
        `Deleted ${result.count} expired email verification token(s)`,
      );
    }
  }
}
