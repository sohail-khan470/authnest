import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from '../strategies/jwt.strategy';

export class JwtAuthGuard extends AuthGuard('jwt') {}
