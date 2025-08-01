import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/Role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>
    ){}

    async findAll(): Promise<Role[]> {
        return this.rolesRepository.find();
    }
}
