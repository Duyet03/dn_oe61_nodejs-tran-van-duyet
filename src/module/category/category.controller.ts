import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Render,
  Put,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { toPositiveInt } from '../../common/util/number.util';

@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @I18n() i18n: I18nContext,
  ) {
    const t = i18n.t('category') as any;
    const category = await this.categoryService.create(createCategoryDto);

    if (!category) {
      throw new BadRequestException(t.create_error);
    }
    return {
      message: t.create_success,
    };
  }

  @Get()
  @Render('category/index')
  async findAll(
    @I18n() i18n: I18nContext,
    @Query('page') page = 1,
    @Query('limit') limit = 5,
  ) {
    const pageNumber = toPositiveInt(page);
    const pageSize = toPositiveInt(limit);

    const t = i18n.t('category') as any;
    const [categories, total] = await this.categoryService.findAll(
      pageNumber,
      pageSize,
    );
    const totalPages = Math.ceil(total / pageSize);
    return {
      categories,
      t,
      currentPage: pageNumber,
      totalPages,
      limit: pageSize,
      isCategoryPage: true,
      l: i18n.t('layout')
    };
  }

  @Get('json')
  async getUsersJson(
    @Query('page') page = 1,
    @Query('limit') limit = 5,
    @I18n() i18n: I18nContext
  ) {
    const pageNumber = toPositiveInt(page);
    const pageSize = toPositiveInt(limit);

    const [categories, total] = await this.categoryService.findAll(pageNumber, pageSize);
    const totalPages = Math.ceil(total / pageSize);
    const t = i18n.t('category') as any;

    return {
      categories,
      currentPage: pageNumber,
      totalPages,
      limit: pageSize,
      t,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @I18n() i18n: I18nContext,
  ) {
    const t = i18n.t('category') as any;
    const category = await this.categoryService.update(+id, updateCategoryDto);
    if (category === null) {
      throw new BadRequestException(t.update_error);
    }
    return { message: t.update_success, category };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @I18n() i18n: I18nContext) {
    const t = i18n.t('category') as any;
    await this.categoryService.remove(+id);
    return { message: t.delete_success };
  }
}
