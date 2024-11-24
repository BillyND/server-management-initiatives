import { Document } from 'mongoose';
import { Permission } from '../../permissions/schemas/permission.schema';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
}
