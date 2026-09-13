import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsPositive, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateAssetItemDto {
  @IsString()
  @MaxLength(100)
  serialNo: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  rate: number;
}

export class CreateAssetsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAssetItemDto)
  items: CreateAssetItemDto[];
}
