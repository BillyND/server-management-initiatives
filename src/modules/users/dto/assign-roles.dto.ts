import { IsArray, IsString } from 'class-validator';
import { Role } from 'src/modules/roles/schemas/role.schema';

export class AssignRolesDto {
  @IsArray()
  @IsString({ each: true })
  roles: Role[];
}
