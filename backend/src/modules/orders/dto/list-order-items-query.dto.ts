import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListOrderItemsQueryDto extends PaginationQueryDto {
  // Exactly one of orderId/tableSessionId is required, not optional: an
  // unscoped list would dump order items across every outlet in the system
  // to any caller with orders.view (see OrderItemsController#findAll, which
  // asserts outlet access against whichever one is given before listing).
  // See use-orders.ts#useOrderItems (orderId) and
  // #useTableSessionItems (tableSessionId).
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  // Items ordered during this table's whole visit, across every Order row
  // it has accumulated (a session isn't 1:1 with an order — see
  // OrdersService#findOpenForTableSession).
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tableSessionId?: number;
}
