import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import {
  UpdateRefreshTokenUserDto,
  UpdatePasswordUserDto,
} from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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
  ): Promise<User> {
    const user = await this.findByEmail(email);
    Object.assign(user, updateProfileDto);

    return await this.userModel
      .findOneAndUpdate({ email }, user, {
        new: true,
      })
      .lean();
  }
}
