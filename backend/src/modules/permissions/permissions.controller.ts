import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from './entities/permission.entity';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(@InjectRepository(Permission) private readonly permissions: Repository<Permission>) {}

  @Get()
  @RequirePermissions('employees.view')
  @ApiOperation({ summary: 'Lists active permissions for position configuration' })
  findAll() {
    return this.permissions.find({ where: { isActive: true }, order: { module: 'ASC', action: 'ASC' } });
  }
}
