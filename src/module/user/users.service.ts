import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/User.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mailerService: MailerService
  ) {}

  async login(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    return user ?? undefined;
  }

  async create(createUserDto: Partial<UpdateUserDto>) {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      return false;
    }
    
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(page: number, limit: number): Promise<[User[], number]> {
    const [result, total] = await this.usersRepository.findAndCount({
      relations: ['role', 'plan'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' }, 
    });

    return [result, total];
  }


  async findOne(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      relations: ['role'], 
    });
  }

  // async update(id: number, productData: Partial<Product>) {
  //       productData.updated_at = new Date();
  //       await this.productRepository.update(id, productData);
  //       return this.productRepository.findOneBy({id});
  //   }

  async update(id: number, updateUserDto: Partial<UpdateUserDto>) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.usersRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const user = this.usersRepository.findOneBy({id});
    await this.usersRepository.delete(id);
    return user;
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const { encrypted_password, repassword, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(encrypted_password, 10);
    const token = uuidv4()
    const user = this.usersRepository.create({ ...rest, encrypted_password: hashedPassword, status: 0, registration_token: token });

    try {
      await this.mailerService
        .sendMail({
          to: user.email, // list of receivers
          subject: 'Activate your account', // Subject line
          text: 'welcome', // plaintext body
          template: 'register',
          context: {
            name: user.name,
            activationCode: user.registration_token
          }
        })
      }catch (error) {
      console.error('Failed to send registration email:', error);
      throw new InternalServerErrorException('Unable to send registration email');
    }

    const savedUser = await this.usersRepository.save(user);
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user ?? undefined;
  }

  async activateAccount(token: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { registration_token: token } });

    if (!user) {
      throw new NotFoundException('Invalid activation token');
    }

    if (user.status === 1) {
      throw new BadRequestException('Account is already activated');
    }

    user.status = 1;
    user.registration_token = null;

    return this.usersRepository.save(user);
  }

}
