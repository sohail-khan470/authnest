import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    //hash password
    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.createUser(dto.email, hashedPassword);
    const newFamilyId = crypto.randomUUID();

    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }
    const { password, ...result } = user;

    return await this.generateTokens(user?.id, user?.email, newFamilyId);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: Role[],
    familyId?: string,
  ) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, roles },
      { expiresIn: '15m' },
    );

    // Generate a random refresh token string
    const refreshToken = crypto.randomUUID();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    // If no familyId provided, it's a new login chain, so generate a new one
    const newFamilyId = familyId || crypto.randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        hashedToken: hashedRefreshToken,
        userId,
        familyId: newFamilyId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const hashedToken = this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        hashedToken,
      },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Reuse detected all sessions revoked');
    }
    const user = await this.usersService.findById(storedToken.userId);
    if (!user) throw new UnauthorizedException('User not found');

    // 6. ROTATION: Mark the CURRENT token as revoked so it can't be used again
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(user.id, user.email, storedToken.familyId);
  }
}
