import { IsArray, IsString } from 'class-validator';
import { Permission } from 'src/modules/permissions/schemas/permission.schema';

export class AssignPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionIds: Permission['name'][];
}
