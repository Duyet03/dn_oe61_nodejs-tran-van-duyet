import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './module/user/users.module';
import { CategoryModule } from './module/category/category.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './module/auth/auth.module';
import configuration from './config/database.config';
import { CurrentUserMiddleware } from './common/middleware/current-user.middleware';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import { AcceptLanguageResolver, CookieResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import { RoleService } from './module/role/role.service';
import { RoleModule } from './module/role/role.module';
import { PlanService } from './module/plan/plan.service';
import { PlanModule } from './module/plan/plan.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    JwtModule.register({
      secret: 'your_secret',
      signOptions: { expiresIn: '1d' },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'l'] }, 
        new HeaderResolver(['x-custom-lang']),
        new CookieResolver(),
        AcceptLanguageResolver,
      ],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
          },
        },
        defaults: {
          from: '"personal spending management" <modules@nestjs.com>',
        },
        template: {
          dir: __dirname + '/mail/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      
    }),
    UsersModule,
    CategoryModule,
    AuthModule,
    RoleModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
    consumer
    .apply(LanguageMiddleware)
    .forRoutes('*');
  }
}
