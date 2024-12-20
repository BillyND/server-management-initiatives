import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { INITIATIVE_STATUS } from '../initiatives.enum';

export type InitiativeDocument = Initiative & Document;

@Schema({ timestamps: true })
export class Initiative {
  @Prop({ required: true })
  department: string;

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
    enum: INITIATIVE_STATUS,
    default: INITIATIVE_STATUS.PENDING,
  })
  status: INITIATIVE_STATUS;
}

export const InitiativeSchema = SchemaFactory.createForClass(Initiative);
