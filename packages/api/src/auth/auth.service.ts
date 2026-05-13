import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Register attempt: email=${dto.email}`);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      this.logger.warn(`Registration failed - email already exists: ${dto.email}`);
      throw new ConflictException('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
      },
      select: { id: true, email: true, username: true, avatar: true },
    });

    this.logger.log(`User registered: id=${user.id}, email=${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: email=${dto.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${dto.email}`);
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: ${dto.email}`);
      throw new UnauthorizedException('邮箱或密码错误');
    }

    this.logger.log(`User logged in: id=${user.id}, email=${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    this.logger.log('Token refresh attempt');
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.logger.log(`Token refreshed for user: ${payload.sub}`);
      const tokens = await this.generateTokens(payload.sub, payload.email);
      return tokens;
    } catch {
      this.logger.warn('Token refresh failed - invalid token');
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
