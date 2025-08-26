import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockCategoryService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CategoryController (Nest DI)', () => {
  let moduleRef: TestingModule;
  let controller: CategoryController;
  let service: CategoryService;

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
    moduleRef = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = moduleRef.get<CategoryController>(CategoryController);
    service = moduleRef.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- CREATE ---
  describe('create', () => {
    it('should create a new category successfully', async () => {
      mockCategoryService.create.mockResolvedValue(mockCategory);
      await expect(controller.create(mockCreateDto, mockI18nContext)).resolves.toEqual({
        message: 'Category created successfully',
      });
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    });

    it('should throw BadRequestException with correct message if service returns null', async () => {
      mockCategoryService.create.mockResolvedValue(null);
      await expect(controller.create(mockCreateDto, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to create category'),
      );
    });

    it('should throw when i18n context is invalid (null)', async () => {
      mockCategoryService.create.mockResolvedValue(mockCategory);
      await expect(controller.create(mockCreateDto, null as any)).rejects.toBeTruthy();
    });

    it('should handle invalid DTO (missing name) by throwing BadRequest when service returns false', async () => {
      const invalidDto = { ...mockCreateDto, name: undefined } as any;
      mockCategoryService.create.mockResolvedValue(false);
      await expect(controller.create(invalidDto, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to create category'),
      );
    });

    it('should handle invalid DTO type (type as string) by delegating to service and propagating BadRequest on false', async () => {
      const invalidDto = { ...mockCreateDto, type: 'wrong' } as any;
      mockCategoryService.create.mockResolvedValue(false);
      await expect(controller.create(invalidDto, mockI18nContext)).rejects.toThrow(BadRequestException);
    });
  });

  // --- GET PAGINATED ---
  describe('getUsersJson', () => {
    it('should get paginated categories', async () => {
      mockCategoryService.findAll.mockResolvedValue([[mockCategory], 1]);
      const result = await controller.getUsersJson(1, 5, mockI18nContext);
      // verify response structure
      expect(result).toEqual(
        expect.objectContaining({
          categories: expect.any(Array),
          currentPage: 1,
          totalPages: expect.any(Number),
          limit: 5,
          t: expect.any(Object),
        }),
      );
      expect(result.categories).toEqual([mockCategory]);
      expect(service.findAll).toHaveBeenCalledWith(1, 5);
    });

    it('should calculate totalPages correctly for multiple pages', async () => {
      const totalItems = 12;
      const limit = 5;
      const expectedTotalPages = 3; // Math.ceil(12 / 5)
      mockCategoryService.findAll.mockResolvedValue([[], totalItems]);
      const result = await controller.getUsersJson(1, limit, mockI18nContext);
      expect(result.totalPages).toBe(expectedTotalPages);
    });

    it('should handle negative pagination values by defaulting them to 1', async () => {
      mockCategoryService.findAll.mockResolvedValue([[], 0]);
      await controller.getUsersJson(-5, -10, mockI18nContext);
      expect(service.findAll).toHaveBeenCalledWith(1, 1);
    });

    it('should handle pagination values of 0 by defaulting them to 1', async () => {
      mockCategoryService.findAll.mockResolvedValue([[], 0]);
      await controller.getUsersJson(0, 0, mockI18nContext);
      expect(service.findAll).toHaveBeenCalledWith(1, 1);
    });

    it('should throw when i18n context is null', async () => {
      await expect(controller.getUsersJson(1, 5, null as any)).rejects.toBeTruthy();
    });
  });

  // --- FIND ONE ---
  describe('findOne', () => {
    it('should get a single category', async () => {
      mockCategoryService.findOne.mockResolvedValue(mockCategory);
      await expect(controller.findOne('1')).resolves.toEqual(mockCategory);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const expectedError = new NotFoundException('Category not found');
      mockCategoryService.findOne.mockRejectedValue(expectedError);
      await expect(controller.findOne('999')).rejects.toThrowError(
        new NotFoundException('Category not found'),
      );
    });

    it('should call service with NaN for a non-numeric id', async () => {
      mockCategoryService.findOne.mockResolvedValue(null);
      await controller.findOne('abc');
      expect(service.findOne).toHaveBeenCalledWith(NaN);
    });
  });

  // --- UPDATE ---
  describe('update', () => {
    it('should update a category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...mockUpdateDto };
      mockCategoryService.update.mockResolvedValue(updatedCategory);
      const result = await controller.update('1', mockUpdateDto, mockI18nContext);
      expect(result).toEqual(
        expect.objectContaining({
          message: 'Category updated successfully',
          category: updatedCategory,
        }),
      );
    });

    it('should throw BadRequestException if update fails', async () => {
      mockCategoryService.update.mockResolvedValue(null);
      await expect(controller.update('1', mockUpdateDto, mockI18nContext)).rejects.toThrowError(
        new BadRequestException('Failed to update category'),
      );
    });

    it('should call service with NaN for a non-numeric id', async () => {
      mockCategoryService.update.mockResolvedValue(null);
      await expect(controller.update('abc', mockUpdateDto, mockI18nContext)).rejects.toThrow(BadRequestException);
      expect(service.update).toHaveBeenCalledWith(NaN, mockUpdateDto);
    });
  });

  // --- REMOVE ---
  describe('remove', () => {
    it('should delete a category successfully', async () => {
      mockCategoryService.remove.mockResolvedValue(mockCategory);
      const result = await controller.remove('1', mockI18nContext);
      expect(result).toEqual(
        expect.objectContaining({ message: 'Category deleted successfully' }),
      );
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service when removing', async () => {
      const expectedError = new NotFoundException('Category to delete not found');
      mockCategoryService.remove.mockRejectedValue(expectedError);
      await expect(controller.remove('999', mockI18nContext)).rejects.toThrowError(
        new NotFoundException('Category to delete not found'),
      );
    });

    it('should call service with NaN for a non-numeric id', async () => {
      mockCategoryService.remove.mockResolvedValue(null);
      await controller.remove('abc', mockI18nContext);
      expect(service.remove).toHaveBeenCalledWith(NaN);
    });

    it('should propagate unexpected errors from service', async () => {
      const unexpectedError = new Error('Database connection lost');
      mockCategoryService.remove.mockRejectedValue(unexpectedError);
      await expect(controller.remove('1', mockI18nContext)).rejects.toThrow(unexpectedError);
    });
  });
});
