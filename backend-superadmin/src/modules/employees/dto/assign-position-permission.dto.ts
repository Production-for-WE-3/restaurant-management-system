import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignPositionPermissionDto {
  @ApiProperty()
  @IsInt()
  permissionId: number;
}
