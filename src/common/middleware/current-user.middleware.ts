// src/common/middleware/current-user.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../module/auth/constants';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.admin_token;
    if (!token) return next();

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      const lang = req.query.lang || req.cookies.lang || 'vi';
      res.locals.lang = lang;

      const user = {
        id: payload.sub,
        name: payload.name,
        role: { name: payload.role },
        lang: lang,
        avatar : payload.avatar,
      };
      req['user'] = user;
      res.locals.user = user; // display in view (Handlebars)
    } catch (err) {
      console.error('JWT verify failed', err);
    }

    next();
  }
}
