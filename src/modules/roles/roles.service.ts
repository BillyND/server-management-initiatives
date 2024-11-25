import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsService } from '../permissions/permissions.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    private permissionsService: PermissionsService,
  ) {}

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role with same name exists
    const existingRole = await this.roleModel
      .findOne({
        name: createRoleDto.name,
      })
      .exec();

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Verify permissions exist if provided
    if (createRoleDto.permissions?.length) {
      await this.verifyPermissionsExist(createRoleDto.permissions);
    }

    const createdRole = new this.roleModel(createRoleDto);
    return (await createdRole.save()).populate('permissions');
  }

  /**
   * Find all roles with optional filtering
   */
  async findAll(filter: Partial<Role> = {}): Promise<Role[]> {
    return this.roleModel.find(filter).populate('permissions').exec();
  }

  /**
   * Find roles by array of IDs
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    return this.roleModel
      .find({
        _id: { $in: ids },
      })
      .populate('permissions')
      .exec();
  }

  /**
   * Find a single role by ID
   */
  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel
      .findById(id)
      .populate('permissions')
      .exec();
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  /**
   * Find a role by name
   */
  async findByName(name: string): Promise<Role> {
    const role = await this.roleModel
      .findOne({ name })
      .populate('permissions')
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }

    return role;
  }

  /**
   * Update a role
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Check if updating name and if it already exists
    if (updateRoleDto.name) {
      const existingRole = await this.roleModel
        .findOne({
          name: updateRoleDto.name,
          _id: { $ne: id },
        })
        .exec();

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Verify permissions exist if provided
    if (updateRoleDto.permissions?.length) {
      await this.verifyPermissionsExist(updateRoleDto.permissions);
    }

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .populate('permissions')
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return updatedRole;
  }

  /**
   * Delete a role
   */
  async remove(id: string): Promise<Role> {
    const deletedRole = await this.roleModel
      .findByIdAndDelete(id)
      .populate('permissions')
      .exec();

    if (!deletedRole) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return deletedRole;
  }

  /**
   * Add permissions to a role
   */
  async addPermissions(id: string, assignPermissionsDto: AssignPermissionsDto) {
    const { permissionIds } = assignPermissionsDto;

    // Verify permissions exist
    await this.verifyPermissionsExist(permissionIds);

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    // Add new permissions (avoid duplicates)
    const updatedPermissions = [
      ...new Set([
        ...role.permissions.map((p) => p.toString()),
        ...permissionIds,
      ]),
    ];

    // TODO: Fix this
    role.permissions = updatedPermissions as any;
    return (await role.save()).populate('permissions');
  }

  /**
   * Remove permissions from a role
   */
  async removePermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<Role> {
    const { permissionIds } = assignPermissionsDto;

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    role.permissions = role.permissions.filter(
      (p) => !permissionIds.includes(p.toString()),
    );

    return (await role.save()).populate('permissions');
  }

  /**
   * Set permissions for a role (replaces existing permissions)
   */
  async setPermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<Role> {
    const { permissionIds } = assignPermissionsDto;

    // Verify permissions exist
    await this.verifyPermissionsExist(permissionIds);

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    // TODO: Fix this
    role.permissions = permissionIds as any;
    return (await role.save()).populate('permissions');
  }

  /**
   * Toggle role active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<Role> {
    const role = await this.roleModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .populate('permissions')
      .exec();

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return role;
  }

  /**
   * Seed default roles
   */
  async seedDefaultRoles(defaultRoles: CreateRoleDto[]): Promise<void> {
    try {
      for (const role of defaultRoles) {
        await this.roleModel.findOneAndUpdate({ name: role.name }, role, {
          upsert: true,
          new: true,
        });
      }
    } catch (error) {
      console.error('Error seeding roles:', error);
      throw error;
    }
  }

  /**
   * Helper method to verify that permissions exist
   */
  private async verifyPermissionsExist(permissionIds: string[]): Promise<void> {
    try {
      const permissions =
        await this.permissionsService.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permissions do not exist');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid permission IDs provided');
    }
  }
}