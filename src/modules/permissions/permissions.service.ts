import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PERMISSIONS } from './permissions.constants';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    private configService: ConfigService,
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

  async toggleActive(id: string, isActive: boolean): Promise<Permission> {
    const permission = await this.permissionModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();

    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    return permission;
  }

  async seedDefaultPermissions() {
    console.log('Seeding default permissions...');

    const defaultPermissions = [
      { name: PERMISSIONS.USERS.CREATE, description: 'Create users' },
      { name: PERMISSIONS.USERS.READ, description: 'Read users' },
      { name: PERMISSIONS.USERS.UPDATE, description: 'Update users' },
      { name: PERMISSIONS.USERS.DELETE, description: 'Delete users' },
      { name: PERMISSIONS.ROLES.CREATE, description: 'Create roles' },
      { name: PERMISSIONS.ROLES.READ, description: 'Read roles' },
      { name: PERMISSIONS.ROLES.UPDATE, description: 'Update roles' },
      { name: PERMISSIONS.ROLES.DELETE, description: 'Delete roles' },
      {
        name: PERMISSIONS.ROLES.MANAGE,
        description: 'Manage role permissions',
      },
      {
        name: PERMISSIONS.PERMISSIONS.CREATE,
        description: 'Create permissions',
      },
      { name: PERMISSIONS.PERMISSIONS.READ, description: 'Read permissions' },
      {
        name: PERMISSIONS.PERMISSIONS.UPDATE,
        description: 'Update permissions',
      },
      {
        name: PERMISSIONS.PERMISSIONS.DELETE,
        description: 'Delete permissions',
      },
      {
        name: PERMISSIONS.INITIATIVES.CREATE,
        description: 'Create initiatives',
      },
      { name: PERMISSIONS.INITIATIVES.READ, description: 'Read initiatives' },
      {
        name: PERMISSIONS.INITIATIVES.UPDATE,
        description: 'Update initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.DELETE,
        description: 'Delete initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.APPROVE,
        description: 'Approve initiatives',
      },
      {
        name: PERMISSIONS.INITIATIVES.REJECT,
        description: 'Reject initiatives',
      },
    ];

    try {
      for (const permission of defaultPermissions) {
        await this.permissionModel.findOneAndUpdate(
          { name: permission.name },
          permission,
          { upsert: true },
        );
      }
    } catch (error) {
      console.error('Error seeding permissions:', error);
    }

    console.log('Default permissions seeded successfully');
  }
}
