import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['dashboard', 'staff', 'both'] })
  @IsOptional() @IsIn(['dashboard', 'staff', 'both']) portal?: 'dashboard' | 'staff' | 'both';
  @ApiPropertyOptional({ type: [Number], description: 'Permission IDs granted to this position' })
  @IsOptional() @IsArray() @Type(() => Number) @IsInt({ each: true }) permissionIds?: number[];
}

export class UpdatePositionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['dashboard', 'staff', 'both'] })
  @IsOptional() @IsIn(['dashboard', 'staff', 'both']) portal?: 'dashboard' | 'staff' | 'both';
  @ApiPropertyOptional() @IsOptional() @IsString() isActive?: boolean;
  @ApiPropertyOptional({ type: [Number], description: 'Permission IDs granted to this position' })
  @IsOptional() @IsArray() @Type(() => Number) @IsInt({ each: true }) permissionIds?: number[];
}
