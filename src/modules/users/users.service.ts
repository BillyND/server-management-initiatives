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

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

  /**
   * Find a user by email and return with mapped role names
   * @param email User's email address
   * @returns User object with roles mapped to role names
   * @throws NotFoundException if user not found
   */
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

  async assignRolesToUser(email: string, roles: Role[]): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          email,
        },
        { $set: { roles } },
        { new: true },
      )
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      });

    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
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
}
