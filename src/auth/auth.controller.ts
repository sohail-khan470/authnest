import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorators';
import { JwtAuthGuard } from './guards/jwt-guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Get('admin-data')
  // @UseGuards(JwtAuthGuard)
  // @Roles('ADMIN')
  // getAdminData() {
  //   return { message: 'Welcom back admin' };
  // }

  @Get('admin-data')
  @UseGuards(AuthGuard('jwt')) // Triggers the JwtStrategy to populate request.user
  @Roles('USER') // Sets the metadata for RolesGuard
  getAdminData(@Req() req: Request) {
    return { message: 'Welcome, Admin!' };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }
}
