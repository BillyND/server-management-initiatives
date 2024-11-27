import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { fetchList } from 'src/fns/fetch.server';
import { Permission } from '../permissions/schemas/permission.schema';
import { Role } from '../roles/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UpdatePasswordUserDto,
  UpdateRefreshTokenUserDto,
} from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { User, UserDocument } from './schemas/user.schema';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel
      .findOne({
        email: createUserDto.email,
      })
      .lean();

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await createdUser.save();

    return savedUser.toObject({
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    });
  }

  async findByEmail(email: string): Promise<IUser> {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
          select: 'name',
        },
      })
      .lean();

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const permissions = user.roles.flatMap((r: any) =>
      r?.permissions?.map((p: Permission) => p.name),
    );

    const roles = user.roles.map((role: Role) => role.name);

    return {
      ...user,
      roles,
      permissions,
    };
  }

  async findByEmailWithRoles(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserPermissions(email: string): Promise<string[]> {
    const user = await this.userModel.findOne({ email }).populate({
      path: 'roles',
      populate: {
        path: 'permissions',
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
    }

    const permissions = new Set<string>();
    user.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }

  async findAll(req: Request, email?: string) {
    return await fetchList(
      req,
      this.userModel,
      [
        {
          $match: {
            email: { $ne: email },
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'roles',
            foreignField: '_id',
            as: 'roles',
          },
        },
        {
          $lookup: {
            from: 'permissions',
            localField: 'roles.permissions',
            foreignField: '_id',
            as: 'permissions',
          },
        },
        {
          $addFields: {
            roles: {
              $map: {
                input: '$roles',
                as: 'role',
                in: '$$role.name',
              },
            },
            permissions: {
              $map: {
                input: '$permissions',
                as: 'permission',
                in: '$$permission.name',
              },
            },
          },
        },
      ],
      [],
    );
  }

  async updateRefreshToken(
    email: string,
    updateRefreshTokenUserDto: UpdateRefreshTokenUserDto,
  ) {
    return this.userModel.findOneAndUpdate(
      { email },
      { refreshToken: updateRefreshTokenUserDto.refreshToken },
      { new: true },
    );
  }

  async updatePassword(
    email: string,
    updatePasswordUserDto: UpdatePasswordUserDto,
  ) {
    return this.userModel.findOneAndUpdate(
      { email },
      { password: updatePasswordUserDto.password },
      { new: true },
    );
  }

  async updateProfile(
    email: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<IUser> {
    await this.userModel.updateOne({ email }, updateProfileDto);
    return await this.findByEmail(email);
  }

  async assignRolesToUser(email: string, roleIds: string[]): Promise<IUser> {
    const roles = roleIds?.length
      ? await this.rolesService.findByIds(roleIds)
      : [];

    if (!roles?.length) {
      throw new NotFoundException('Roles not found');
    }

    await this.userModel.updateOne(
      {
        email,
      },
      { $set: { roles } },
    );

    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
    }

    return user;
  }
}
