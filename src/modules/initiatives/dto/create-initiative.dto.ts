import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInitiativeDto {
  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsString()
  position: string;

  // Initiative Description
  @IsNotEmpty()
  @IsString()
  initiativeName: string;

  @IsNotEmpty()
  @IsString()
  problem: string;

  @IsNotEmpty()
  @IsString()
  goal: string;

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsNotEmpty()
  @IsString()
  expectedResult: string;

  // Attachments
  @IsOptional()
  @IsString()
  attachment?: string;
}
