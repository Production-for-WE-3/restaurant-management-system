import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private scope(user: User, request: AuthenticatedRequest & { tenantId?: number }) {
    return request.tenantId ?? (user.isSuperadmin ? undefined : user.tenantId ?? undefined);
  }

  @Get()
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Lists users (paginated, optional search)' })
  findAll(@Query() query: ListUsersQueryDto, @CurrentUser() user: User, @Req() request: AuthenticatedRequest & { tenantId?: number }) {
    return this.usersService.findAll(query, this.scope(user, request));
  }

  @Get(':id')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Gets a user' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() request: AuthenticatedRequest & { tenantId?: number }) {
    return this.usersService.findOne(id, this.scope(user, request));
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({
    summary: 'Creates a staff user with an admin-set initial password',
  })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: User, @Req() request: AuthenticatedRequest & { tenantId?: number }) {
    const tenantId = this.scope(user, request);
    if (tenantId === undefined) throw new ForbiddenException('User creation requires a tenant hostname');
    return this.usersService.create(dto, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: "Updates a user's name/email" })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() user: User, @Req() request: AuthenticatedRequest & { tenantId?: number }) {
    return this.usersService.update(id, dto, this.scope(user, request));
  }

  @Patch(':id/password')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: "Resets a user's password without revealing the old password" })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest & { tenantId?: number },
  ) {
    return this.usersService.resetPassword(id, dto.newPassword, this.scope(user, request));
  }

  /* removed superadmin flag mutation */
  /*
  @ApiOperation({
    summary:
      "Grants or revokes a user's superadmin flag (superadmin bypasses all permission checks) — callable only by an existing superadmin",
  })
  setSuperadmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetSuperadminDto,
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest & { tenantId?: number },
  ) {
    return this.usersService.setSuperadmin(id, dto.isSuperadmin, this.scope(user, request));
  }
  */

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users.manage')
  @ApiOperation({
    summary:
      "Disables the user's linked employee account",
  })
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() request: AuthenticatedRequest & { tenantId?: number }) {
    return this.usersService.deactivate(id, this.scope(user, request));
  }

}
