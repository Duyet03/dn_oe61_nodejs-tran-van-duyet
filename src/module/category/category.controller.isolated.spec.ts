import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

describe('CategoryController (Isolated)', () => {
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
        } as any;
      }
      if (key === 'layout') return { title: 'Layout' } as any;
      const flat: Record<string, string> = {
        'category.create_success': 'Category created successfully',
        'category.create_error': 'Failed to create category',
        'category.update_success': 'Category updated successfully',
        'category.update_error': 'Failed to update category',
        'category.delete_success': 'Category deleted successfully',
      };
      return flat[key] || key;
    },
  } as I18nContext;

  beforeEach(() => {
    service = new CategoryService({} as any);
    controller = new CategoryController(service);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new category successfully', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockCategory as any);
      const result = await controller.create(mockCreateDto, mockI18nContext);
      expect(result).toEqual({ message: 'Category created successfully' });
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    });

    it('should throw BadRequestException if service returns null (create)', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(false as any);
      try {
        await controller.create(mockCreateDto, mockI18nContext);
        fail('Expected BadRequestException');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        const resp = e.getResponse?.();
        expect((resp && resp.message) || e.message).toContain('Failed to create category');
      }
    });

    it('should propagate error from service (create)', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(new Error('Unexpected'));
      await expect(controller.create(mockCreateDto, mockI18nContext)).rejects.toThrow('Unexpected');
    });

    it('should handle invalid DTO (missing name) by delegating to service and throwing BadRequest on false', async () => {
      const invalidDto = { ...mockCreateDto, name: undefined } as any;
      jest.spyOn(service, 'create').mockResolvedValue(false as any);
      await expect(controller.create(invalidDto, mockI18nContext)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when i18n context is null', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockCategory as any);
      await expect(controller.create(mockCreateDto, null as any)).rejects.toBeTruthy();
    });
  });

  describe('getUsersJson', () => {
    it('should get paginated categories', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([[mockCategory] as any, 1]);
      const result = await controller.getUsersJson(1, 5, mockI18nContext);
      expect(result.categories).toEqual([mockCategory]);
      expect(result.currentPage).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(1);
      expect(service.findAll).toHaveBeenCalledWith(1, 5);
    });

    it('should handle empty list of categories', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([[], 0] as any);
      const result = await controller.getUsersJson(1, 5, mockI18nContext);
      expect(result.categories).toEqual([]);
      expect(result.totalPages).toBe(0);
    });

    it('should handle non-numeric pagination values by defaulting them to 1', async () => {
      const spy = jest.spyOn(service, 'findAll').mockResolvedValue([[], 0] as any);
      await controller.getUsersJson('abc' as any, 'xyz' as any, mockI18nContext);
      expect(spy).toHaveBeenCalledWith(1, 1);
    });

    it('should handle negative pagination values by defaulting them to 1', async () => {
      const spy = jest.spyOn(service, 'findAll').mockResolvedValue([[], 0] as any);
      await controller.getUsersJson(-5, -10, mockI18nContext);
      expect(spy).toHaveBeenCalledWith(1, 1);
    });

    it('should propagate error from service (getUsersJson)', async () => {
      jest.spyOn(service, 'findAll').mockRejectedValue(new Error('Unexpected'));
      await expect(controller.getUsersJson(1, 5, mockI18nContext)).rejects.toThrow('Unexpected');
    });
  });

  describe('findOne', () => {
    it('should get a single category', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCategory as any);
      const result = await controller.findOne('1');
      expect(result).toEqual(mockCategory);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should call service with NaN for a non-numeric id', async () => {
      const spy = jest.spyOn(service, 'findOne').mockResolvedValue(null);
      await controller.findOne('abc');
      expect(spy).toHaveBeenCalledWith(NaN);
    });

    it('should propagate NotFoundException from service (findOne)', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.findOne('999')).rejects.toThrowError(new NotFoundException('Not found'));
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...mockUpdateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedCategory as any);
      const result = await controller.update('1', mockUpdateDto, mockI18nContext);
      expect(result).toEqual({
        message: 'Category updated successfully',
        category: updatedCategory,
      });
      expect(service.update).toHaveBeenCalledWith(1, mockUpdateDto);
    });

    it('should throw BadRequestException if service returns null (update)', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(null);
      try {
        await controller.update('1', mockUpdateDto, mockI18nContext);
        fail('Expected BadRequestException');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        const resp = e.getResponse?.();
        expect((resp && resp.message) || e.message).toContain('Failed to update category');
      }
    });

    it('should call service with NaN for a non-numeric id', async () => {
      const spy = jest.spyOn(service, 'update').mockResolvedValue(null);
      await controller.update('abc', mockUpdateDto, mockI18nContext).catch(() => {});
      expect(spy).toHaveBeenCalledWith(NaN, mockUpdateDto);
    });

    it('should propagate NotFoundException from service (update)', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.update('1', mockUpdateDto, mockI18nContext)).rejects.toThrowError(new NotFoundException('Not found'));
    });
  });

  describe('remove', () => {
    it('should delete a category successfully', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockCategory as any);
      const result = await controller.remove('1', mockI18nContext);
      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should call service with NaN for a non-numeric id', async () => {
      const spy = jest.spyOn(service, 'remove').mockResolvedValue(null);
      await controller.remove('abc', mockI18nContext);
      expect(spy).toHaveBeenCalledWith(NaN);
    });

    it('should propagate NotFoundException from service (remove)', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.remove('1', mockI18nContext)).rejects.toThrowError(new NotFoundException('Not found'));
    });
  });
});
