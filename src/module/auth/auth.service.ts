import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.login(email);
    // with bcrypt "bcrypt.compare(pass, user.encrypted_password)"
    if (user && pass === user.encrypted_password) {
      const { encrypted_password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role.name,
    };
    return {
      admin_token: this.jwtService.sign(payload),
    };
  }
}
