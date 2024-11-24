import { IsString } from 'class-validator';

export class UpdateRefreshTokenUserDto {
  @IsString()
  refreshToken: string;
}

export class UpdatePasswordUserDto {
  @IsString()
  password: string;
}
