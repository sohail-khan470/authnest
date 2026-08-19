import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'SUPER_SECRET_DEV_KEY',
    });
  }

  // Passport automatically verifies the JWT signature. If valid, it passes the decoded payload here.
  async validate(payload: JwtPayload) {
    // We attach the decoded payload to request.user, which RolesGuard will read
    console.log('SSSSSS');
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
