export interface IUser {
  _id: any;
  email: string;
  name: string;
  password: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  refreshToken?: string;
  phone: string;
  department: string;
  position: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}
