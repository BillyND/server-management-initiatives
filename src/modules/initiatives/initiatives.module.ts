import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';
import { Initiative, InitiativeSchema } from './schemas/initiative.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Initiative.name, schema: InitiativeSchema },
    ]),
    UsersModule,
  ],
  controllers: [InitiativesController],
  providers: [InitiativesService],
  exports: [InitiativesService],
})
export class InitiativesModule {}
