import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsInt, IsOptional } from 'class-validator';

/** GET /reservations/tables — batched form of GET /reservations/:id/tables. */
export class ListReservationTablesBatchQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  outletId: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated reservation ids',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id))
      : value,
  )
  @ArrayNotEmpty()
  @IsInt({ each: true })
  reservationIds: number[];
}
