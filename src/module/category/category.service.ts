import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../../entities/Category.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const name = createCategoryDto.name;
    const category_exit = await this.categoryRepository.findOne({ where: { name } });
    
    if (category_exit) {
      return false;
    }
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(page: number, limit: number): Promise<[Category[], number]> {
    const [result, total] = await this.categoryRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' }, 
    });
    return [result, total];
  }

  findOne(id: number) {
    return this.categoryRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const name = updateCategoryDto.name;
    const category_exists = await this.categoryRepository.findOne({
      where: {
        name,
        id: Not(id), // exclude the current category by ID
      },
    });
    
    if (category_exists) {
      return null;
    }

    await this.categoryRepository.update(id, updateCategoryDto);
    return this.categoryRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const category = this.categoryRepository.findOneBy({id});
    await this.categoryRepository.delete(id);
    return category;
  }
}
