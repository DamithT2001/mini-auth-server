import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes by requiring a valid Bearer JWT in the Authorization header. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<T>(err: unknown, user: T): T {
    if (err) {
      this.logger.warn(`JWT validation error: ${String(err)}`);
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}
