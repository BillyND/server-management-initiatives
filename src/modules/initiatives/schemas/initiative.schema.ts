import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { InitiativeStatus } from '../../../enums/initiative.enum';

export type InitiativeDocument = Initiative & Document;

@Schema({ timestamps: true })
export class Initiative {
  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  email: string;

  // Initiative Description
  @Prop({ required: true })
  initiativeName: string;

  @Prop({ required: true })
  problem: string;

  @Prop({ required: true })
  goal: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  expectedResult: string;

  // Attachments
  @Prop()
  attachment?: string;

  @Prop({
    type: String,
    enum: InitiativeStatus,
    default: InitiativeStatus.PENDING,
  })
  status: InitiativeStatus;
}

export const InitiativeSchema = SchemaFactory.createForClass(Initiative);
