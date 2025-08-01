import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from 'src/entities/Plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlanService {
    constructor(
        @InjectRepository(Plan) 
        private readonly plansRepository: Repository<Plan> 
    ) {}

    async findAll(): Promise<Plan[]> {
        return this.plansRepository.find();
    }
}
