import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INITIATIVE_STATUS } from './initiatives.enum';
import { fetchList } from '../../fns/fetch.server';
import { CreateInitiativeDto } from './dto/create-initiative.dto';
import { Initiative, InitiativeDocument } from './schemas/initiative.schema';

@Injectable()
export class InitiativesService {
  constructor(
    @InjectModel(Initiative.name)
    private initiativeModel: Model<InitiativeDocument>,
  ) {}

  async create(
    createInitiativeDto: CreateInitiativeDto,
    user: any,
  ): Promise<Initiative> {
    try {
      const initiative = new this.initiativeModel({
        ...createInitiativeDto,
        status: INITIATIVE_STATUS.PENDING,
        email: user.email,
      });

      return await initiative.save();
    } catch (error) {
      throw new BadRequestException('Failed to create initiative', error);
    }
  }

  async findAll(req: Request, user: any) {
    return await fetchList(
      req,
      this.initiativeModel,
      [{ $match: { email: user.email } }],
      [],
    );
  }

  async findOne(id: string, user: any): Promise<Initiative> {
    const initiative = await this.initiativeModel
      .findOne({
        _id: id,
        createdBy: user.sub,
      })
      .exec();

    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }
    return initiative;
  }

  async update(
    id: string,
    updateData: Partial<CreateInitiativeDto>,
    user: any,
  ): Promise<Initiative> {
    const initiative = await this.initiativeModel.findOne({
      _id: id,
      createdBy: user.sub,
    });

    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }

    return this.initiativeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async submit(id: string, user: any): Promise<Initiative> {
    const initiative = await this.initiativeModel.findOne({
      _id: id,
      createdBy: user.sub,
    });

    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }

    return this.initiativeModel
      .findByIdAndUpdate(
        id,
        {
          status: INITIATIVE_STATUS.PENDING,
          submittedAt: new Date(),
          submittedBy: user.sub,
        },
        { new: true },
      )
      .exec();
  }
}
