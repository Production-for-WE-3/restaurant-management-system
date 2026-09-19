import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsService } from '../auth/permissions.service';
import { User } from '../users/entities/user.entity';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ListOutletsQueryDto } from './dto/list-outlets-query.dto';
import { OutletsService } from './outlets.service';

@ApiTags('outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletsController {
  constructor(
    private readonly outletsService: OutletsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  @RequirePermissions('outlets.view')
  @ApiOperation({ summary: 'Lists outlets (paginated, optional search)' })
  findAll(
    @Query() query: ListOutletsQueryDto,
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest & { tenantId?: number },
  ) {
    return this.outletsService.findAll(
      query,
      request.tenantId ?? user.tenantId ?? undefined,
    );
  }

  /**
   * Outlets the current user is actually assigned to — no `outlets.view`
   * permission required, since knowing which outlet(s) you work at is an
   * assignment fact, not a permission grant. Users with only global
   * (unscoped) assignments get every outlet back; everyone else gets exactly
   * their assigned outlets, never the full list. Must stay declared before
   * `:id` so "assigned" isn't parsed as an id.
   */
  @Get('assigned')
  @ApiOperation({
    summary:
      "Lists only the current user's assigned outlets (falls back to every outlet for globally-scoped users)",
  })
  async findAssigned(
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest & { tenantId?: number },
  ) {
    const tenantId = request.tenantId ?? user.tenantId ?? undefined;
    const employeeOutletIds =
      await this.permissionsService.getEmployeeAssignedOutletIds(user.id);
    if (employeeOutletIds.length > 0) {
      return this.outletsService.findByIds(employeeOutletIds, tenantId);
    }
    const outletIds = await this.permissionsService.getAccessibleOutletIds(
      user.id,
    );
    // null: no active role assignment at all -> no outlets, not every outlet.
    if (outletIds === null) {
      return [];
    }
    if (outletIds.length === 0) {
      return this.outletsService.findAllUnpaginated(tenantId);
    }
    return this.outletsService.findByIds(outletIds, tenantId);
  }

  @Get(':id')
  @RequirePermissions('outlets.view')
  @ApiOperation({ summary: 'Gets an outlet' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.outletsService.findOne(id);
  }
}
