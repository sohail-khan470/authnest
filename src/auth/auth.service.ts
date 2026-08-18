import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    //hash password
    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.createUser(dto.email, hashedPassword);
    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }
    const { password, ...result } = user;
    return result;
  }
}
