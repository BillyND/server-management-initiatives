import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Check if permission with same name exists
    const existingPermission = await this.permissionModel.findOne({
      name: createPermissionDto.name,
    });

    if (existingPermission) {
      throw new ConflictException('Permission with this name already exists');
    }

    const createdPermission = new this.permissionModel(createPermissionDto);
    return createdPermission.save();
  }

  async findAll(filter: Partial<Permission> = {}): Promise<Permission[]> {
    return this.permissionModel.find(filter).exec();
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.permissionModel
      .find({
        _id: { $in: ids },
      })
      .exec();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionModel.findOne({ name }).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with name ${name} not found`);
    }
    return permission;
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    // Check if updating name and if it already exists
    if (updatePermissionDto.name) {
      const existingPermission = await this.permissionModel.findOne({
        name: updatePermissionDto.name,
        _id: { $ne: id },
      });

      if (existingPermission) {
        throw new ConflictException('Permission with this name already exists');
      }
    }

    const updatedPermission = await this.permissionModel
      .findByIdAndUpdate(id, updatePermissionDto, { new: true })
      .exec();

    if (!updatedPermission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    return updatedPermission;
  }

  async remove(id: string): Promise<Permission> {
    const deletedPermission = await this.permissionModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedPermission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    return deletedPermission;
  }

  async bulkCreate(permissions: CreatePermissionDto[]): Promise<Permission[]> {
    const createdPermissions = await this.permissionModel.insertMany(
      permissions,
      { ordered: false }, // Continue inserting even if some fail
    );
    return createdPermissions;
  }

  async seedDefaultPermissions(permissions: CreatePermissionDto[]) {
    try {
      for (const permission of permissions) {
        await this.permissionModel.findOneAndUpdate(
          { name: permission.name },
          permission,
          { upsert: true },
        );
      }
    } catch (error) {
      console.error('Error seeding permissions:', error);
      throw error;
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<Permission> {
    const permission = await this.permissionModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();

    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    return permission;
  }
}
