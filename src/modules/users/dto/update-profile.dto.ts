import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 50, { message: 'Full name must be between 2 and 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Department must not exceed 50 characters' })
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Position must not exceed 50 characters' })
  position?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @MaxLength(15, { message: 'Phone number must not exceed 15 characters' })
  @Matches(/^$|^[0-9+\-\s()]+$/, {
    message:
      'Phone number can only be empty or contain numbers and the characters +, -, (), space',
  })
  @IsOptional()
  phone?: string;
}
