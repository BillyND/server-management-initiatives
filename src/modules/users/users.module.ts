import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PermissionsModule,
  ],
  providers: [UsersService, PermissionsService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
