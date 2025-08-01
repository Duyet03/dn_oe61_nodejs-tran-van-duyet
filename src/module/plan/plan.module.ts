import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './plan.service';
import { Plan } from 'src/entities/Plan.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Plan])],
    controllers: [],
    providers: [PlanService],
    exports: [PlanService],
})
export class PlanModule {}
