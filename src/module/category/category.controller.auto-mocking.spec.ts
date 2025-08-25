import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

describe('CategoryController (Auto-mocking with useMocker)', () => {
  let controller: CategoryController;
  let service: DeepMocked<CategoryService>;

  // --- MOCK DATA & CONSTANTS ---
  const mockCategory = {
    id: 1,
    name: 'Salary',
    type: 1,
    description: 'Monthly salary',
    created_by: 1,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    createdByUser: null,
    updatedByUser: null,
    categoryUsers: [],
  };

  const mockCreateDto: CreateCategoryDto = {
    name: 'Groceries',
    type: 0,
    description: 'For food',
    created_by: 1,
  };

  const mockUpdateDto: UpdateCategoryDto = {
    name: 'Updated Groceries',
    description: 'Updated description',
  };

  const mockI18nContext = {
    t: (key: string) => {
      if (key === 'category') {
        return {
          create_success: 'Category created successfully',
          create_error: 'Failed to create category',
          update_success: 'Category updated successfully',
          update_error: 'Failed to update category',
          delete_success: 'Category deleted successfully',
        };
      }
      if (key === 'layout') {
        return { title: 'Layout' };
      }
      return {};
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
    })
      .useMocker(createMock)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- CREATE ---
  describe('create', () => {
    it('should create a new category successfully with proper response structure', async () => {
      service.create.mockResolvedValue(mockCategory as any);
      const result = await controller.create(mockCreateDto, mockI18nContext);
      expect(result).toEqual(
        expect.objectContaining({
          message: 'Category created successfully',
        }),
      );
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    });

    it('should throw BadRequestException with correct message if service returns a falsy value', async () => {
      service.create.mockResolvedValue(false as any);
      await expect(controller.create(mockCreateDto, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to create category'),
      );
    });

    it('should throw TypeError if i18n context is invalid', async () => {
      await expect(controller.create(mockCreateDto, null as any)).rejects.toThrow(TypeError);
    });

    it('should throw BadRequest when DTO is null', async () => {
      service.create.mockResolvedValue(false as any);
      await expect(controller.create(null as any, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to create category'),
      );
    });

    it('should throw BadRequest when DTO has wrong types', async () => {
      const wrongDto = { name: 123, type: 'x', created_by: 'y' } as any;
      service.create.mockResolvedValue(false as any);
      await expect(controller.create(wrongDto, mockI18nContext)).rejects.toThrow(BadRequestException);
    });
  });

  // --- GET PAGINATED ---
  describe('getUsersJson', () => {
    it('should calculate totalPages correctly for multiple pages and include response structure', async () => {
      const totalItems = 12;
      const limit = 5;
      const expectedTotalPages = 3;
      service.findAll.mockResolvedValue([[], totalItems]);
      const result = await controller.getUsersJson(1, limit, mockI18nContext);
      expect(result).toEqual(
        expect.objectContaining({
          categories: expect.any(Array),
          currentPage: 1,
          totalPages: expectedTotalPages,
          limit,
          t: expect.any(Object),
        }),
      );
    });

    it('should default 0 values to 1 (page, limit)', async () => {
      service.findAll.mockResolvedValue([[], 0]);
      await controller.getUsersJson(0, 0, mockI18nContext);
      expect(service.findAll).toHaveBeenCalledWith(1, 1);
    });

    it('should default non-numeric values to 1 for page and limit', async () => {
      service.findAll.mockResolvedValue([[], 0]);
      await controller.getUsersJson('abc' as any, 'xyz' as any, mockI18nContext);
      expect(service.findAll).toHaveBeenCalledWith(1, 1);
    });

    it('should use default limit when undefined and page=1 when null', async () => {
      service.findAll.mockResolvedValue([[], 0]);
      await controller.getUsersJson(null as any, undefined as any, mockI18nContext);
      expect(service.findAll).toHaveBeenCalledWith(1, 5);
    });

    it('should throw when i18n context is null', async () => {
      await expect(controller.getUsersJson(1, 5, null as any)).rejects.toBeTruthy();
    });
  });

  // --- FIND ONE ---
  describe('findOne', () => {
    it('should get a single category', async () => {
      service.findOne.mockResolvedValue(mockCategory as any);
      await expect(controller.findOne('1')).resolves.toEqual(mockCategory);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException with correct message', async () => {
      const expectedError = new NotFoundException('Category not found');
      service.findOne.mockRejectedValue(expectedError);
      await expect(controller.findOne('999')).rejects.toThrowError(
        new NotFoundException('Category not found'),
      );
    });

    it('should use 0 for null id and NaN for undefined id', async () => {
      service.findOne.mockResolvedValue(null as any);
      await controller.findOne(null as any);
      expect(service.findOne).toHaveBeenCalledWith(0);
      await controller.findOne(undefined as any);
      expect(service.findOne).toHaveBeenCalledWith(NaN);
    });
  });

  // --- UPDATE ---
  describe('update', () => {
    it('should update a category successfully with proper response structure', async () => {
      const updatedCategory = { ...mockCategory, ...mockUpdateDto };
      service.update.mockResolvedValue(updatedCategory as any);
      const result = await controller.update('1', mockUpdateDto, mockI18nContext);
      expect(result).toEqual(
        expect.objectContaining({
          message: 'Category updated successfully',
          category: expect.objectContaining({ id: 1, name: updatedCategory.name }),
        }),
      );
    });

    it('should throw BadRequestException with correct message when service returns null', async () => {
      service.update.mockResolvedValue(null);
      await expect(controller.update('1', mockUpdateDto, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to update category'),
      );
    });

    it('should call service with NaN for a non-numeric id', async () => {
      service.update.mockResolvedValue(null);
      await expect(controller.update('abc', mockUpdateDto, mockI18nContext)).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith(NaN, mockUpdateDto);
    });

    it('should throw if i18n is null', async () => {
      service.update.mockResolvedValue(mockCategory as any);
      await expect(controller.update('1', mockUpdateDto, null as any)).rejects.toBeTruthy();
    });
  });

  // --- REMOVE ---
  describe('remove', () => {
    it('should delete a category successfully with response structure', async () => {
      service.remove.mockResolvedValue(mockCategory as any);
      const result = await controller.remove('1', mockI18nContext);
      expect(result).toEqual(expect.objectContaining({ message: 'Category deleted successfully' }));
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException with correct message when removing', async () => {
      const expectedError = new NotFoundException('Category to delete not found');
      service.remove.mockRejectedValue(expectedError);
      await expect(controller.remove('999', mockI18nContext)).rejects.toThrowError(
        new NotFoundException('Category to delete not found'),
      );
    });

    it('should call service with NaN for a non-numeric id', async () => {
      service.remove.mockResolvedValue(null as any);
      await controller.remove('abc', mockI18nContext);
      expect(service.remove).toHaveBeenCalledWith(NaN);
    });

    it('should throw if i18n is null', async () => {
      service.remove.mockResolvedValue(mockCategory as any);
      await expect(controller.remove('1', null as any)).rejects.toBeTruthy();
    });
  });
});
