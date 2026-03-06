import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../infrastructure/security/jwt.service';
import { MailService } from '../mail/mail.service';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        isEmailVerified: false,
      },
    });

    const verificationToken = await this.emailVerificationService.generate(
      user.id,
    );

    let emailSent = true;
    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    } catch (err) {
      emailSent = false;
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        err,
      );
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      emailSent,
      ...(emailSent
        ? {
            message:
              'Registration successful. Please check your email to verify your account.',
          }
        : {
            message:
              'Account created but verification email could not be sent. Use resend to try again.',
          }),
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email address is not verified');
    }

    const client = await this.prisma.clientApplication.findUnique({
      where: { clientId: dto.clientId },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
    });

    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN'),
    };
  }

  async resendVerificationEmail(dto: ResendVerificationDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Return silently if user not found or already verified to avoid leaking info
    if (!user || user.isEmailVerified) return;

    const token = await this.emailVerificationService.generate(user.id);
    await this.mailService.sendVerificationEmail(user.email, token);
  }
}
