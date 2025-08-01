import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/User.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { RoleModule } from '../role/role.module';
import { Plan } from 'src/entities/Plan.entity';
import { PlanModule } from '../plan/plan.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
    RoleModule,
    PlanModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
