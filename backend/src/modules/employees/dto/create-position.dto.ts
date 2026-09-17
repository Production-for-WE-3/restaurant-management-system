import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [Number], description: 'Permission IDs granted to this position' })
  @IsOptional() @IsArray() @Type(() => Number) @IsInt({ each: true }) permissionIds?: number[];
}

export class UpdatePositionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isActive?: boolean;
  @ApiPropertyOptional({ type: [Number], description: 'Permission IDs granted to this position' })
  @IsOptional() @IsArray() @Type(() => Number) @IsInt({ each: true }) permissionIds?: number[];
}
