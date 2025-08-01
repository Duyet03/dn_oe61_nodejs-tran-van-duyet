import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Render,
  Res,
  UseGuards,
  Put,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleService } from '../role/role.service';
import { PlanService } from '../plan/plan.service';
import { I18n, I18nContext } from 'nestjs-i18n';
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
    private readonly planService: PlanService,

  ) {}

  @Get()
  @Render('users/index')
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 1,
    @I18n() i18n: I18nContext,
  ) {
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));

    const [users, total] = await this.usersService.findAll(pageNumber, pageSize);
    const roles = await this.roleService.findAll();
    const plans = await this.planService.findAll();
    const t = i18n.t('user') as any;

    const totalPages = Math.ceil(total / pageSize);

    return {
      users,
      roles,
      plans,
      t,
      currentPage: pageNumber,
      totalPages,
      limit: pageSize,
      isUsersPage: true,
    };
  }

  @Get('json')
  async getUsersJson(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @I18n() i18n: I18nContext
  ) {
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));

    const [users, total] = await this.usersService.findAll(pageNumber, pageSize);
    const totalPages = Math.ceil(total / pageSize);
    const t = i18n.t('user') as any;

    return {
      users,
      currentPage: pageNumber,
      totalPages,
      limit: pageSize,
      t,
    };
  }

  @Get('create')
  @Render('users/create')
  showCreateForm() {
    return {};
  }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @I18n() i18n: I18nContext
  ) {
    const { repassword, ...createData } = createUserDto;
    const t = i18n.t('user') as any;
    if (createUserDto.encrypted_password !== repassword) {
      throw new BadRequestException(t.password_mismatch);
    }
    
    const user = await this.usersService.create(createData);
    if (!user) {
      throw new BadRequestException(t.emailAlreadyInUse);
    }
    return { message: t.create_success, user };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext
  ) {
    const t = i18n.t('user') as any;

    const { repassword, ...updateData } = updateUserDto;
    if (updateUserDto.encrypted_password !== repassword) {
      throw new BadRequestException(t.password_mismatch);
    }

    const user = await this.usersService.update(+id, updateData);
    if(!user) {
      throw new BadRequestException(t.emailAlreadyInUse);
    }
    return { message: t.update_success, user };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @I18n() i18n: I18nContext) {
    const t = i18n.t('user') as any;
    await this.usersService.remove(+id);
    return { message: t.delete_success };
  }

  @Get('admin/login')
  loginView(@Res() res: Response) {
    res.render('admin/login', {
      layout: 'login',
      message: 'Please log in to access the admin panel.',
    });
  }
}
